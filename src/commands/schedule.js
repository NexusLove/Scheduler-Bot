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
		const checkForPosts = async () => {
			const query = {
				date: {
					$lte: Date.now(),
				},
			};

			const results = await scheduledMessage.find(query);

			for (post of results) {
				const { guildId, channelId, content } = post;

				const guild = await client.guilds.fetch(guildId);
				if (!guild) continue;

				const channel = guild.channels.cache.get(channelId);
				if (!channel) continue;

				channel.send(content);
			}

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

			await new scheduledMessage({
				date: targetDate.valueOf(),
				content: collectedMessage,
				guildId: guild.id,
				channelId: targetChannel.id,
			}).save();
		});
	},
};
