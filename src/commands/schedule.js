const momentTimezone = require("moment-timezone");
const { MessageCollector } = require("discord.js");

const scheduledMessage = require("../models/scheduleMessage");

module.exports = {
	requiredPermissions: ["ADMINISTRATOR"],
	expectedArgs:
		'<Channel Tag> <YYYY/MM/DD> <HH:MM> <"AM" or "PM"> <Timezone>',
	minArgs: 5,
	maxArgs: 5,
	init: (client) => {
		// Check for messages to be sent every 2 seconds. Recursive function.
		const checkForPosts = async () => {
			const query = {
				date: {
					$lte: Date.now(),
				},
			};

			//Get results from database matching the current date time.
			const results = await scheduledMessage.find(query);

			//Iterate through the messages to be sent.
			for (post of results) {
				const { guildId, channelId, content } = post;

				//If bot kicked out of server or server no longer exists, do nothing.
				const guild = await client.guilds.fetch(guildId);
				if (!guild) continue;

				//If bot kicked out of server or channel no longer exists, do nothing.
				const channel = guild.channels.cache.get(channelId);
				if (!channel) continue;

				//Send scheduled message to the required channel.
				channel.send(content);
			}

			//Delete all the sent messages.
			await scheduledMessage.deleteMany(query);

			setTimeout(checkForPosts, 1000 * 2);
		};
		checkForPosts();
	},
	callback: async ({ message, args }) => {
		const { mentions, guild, channel } = message;
		const targetChannel = mentions.channels.first();
		if (!targetChannel) {
			message.reply("Please tag a channel to send your message in.");
			return;
		}

		//Remove the channel tag from args array
		args.shift();

		//Check if the date time provided is valid.
		const [date, time, clockType, timezone] = args;

		if (clockType !== "AM" && clockType !== "PM") {
			message.reply(
				`Please enter a valid clocktype. You must provide either "AM" or "PM". You provided ${clockType}.`,
			);
			return;
		}

		const validTimezones = momentTimezone.tz.names();
		if (!validTimezones.includes(timezone)) {
			message.reply(`Unknown timezone ${timezone}.`);
			return;
		}

		const targetDate = momentTimezone.tz(
			`${date} ${time} ${clockType}`,
			"YYYY-MM-DD HH:mm A",
			timezone,
		);

		//Collect the message to be scheduled.
		message.reply("Please send the message you would like to schedule.");

		const filter = (val) => {
			return message.author.id === val.author.id;
		};

		const messageCollector = new MessageCollector(channel, filter, {
			max: 1,
			time: 120000,
		});

		messageCollector.on("end", async (collected) => {
			const collectedMessage = collected.first();
			if (!collectedMessage) {
				message.reply(
					"Timed out. You did not provide a message to schedule within time.",
				);
				return;
			}

			message.reply("Your message has been scheduled.");

			//Save message to the database.
			await new scheduledMessage({
				date: targetDate.valueOf(),
				content: collectedMessage,
				guildId: guild.id,
				channelId: targetChannel.id,
			}).save();
		});
	},
};
