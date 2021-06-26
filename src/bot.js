require("dotenv").config();

const { Client, WebhookClient } = require("discord.js");

const client = new Client();
const webhook = new WebhookClient(
	process.env.WEBHOOK_ID,
	process.env.WEBHOOK_TOKEN,
);

const PREFIX = "$";

client.on("ready", () => {
	console.log("bot logged in");
});

client.on("message", (message) => {
	if (message.author.bot) return;
	console.log(message.content);
	if (message.content.startsWith(PREFIX)) {
		const [CMD_NAME, ...args] = message.content
			.trim()
			.substring(PREFIX.length)
			.split(/\s+/);
		console.log(CMD_NAME);
		console.log(args);
		if (CMD_NAME === "add") {
			message.channel.send(parseFloat(args[0]) + parseFloat(args[1]));
		} else {
			const msg = args.join(" ");
			webhook.send(msg);
		}
	}
});

client.login(process.env.BOT_TOKEN);
