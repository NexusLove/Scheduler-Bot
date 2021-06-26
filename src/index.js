require("dotenv").config();

const DiscordJs = require("discord.js");
const WOKcommands = require("wokcommands");

const client = new DiscordJs.Client();

client.login(process.env.CAPTAIN_HOOK_TOKEN);

client.on("ready", () => {
	console.log("Bot logged in");
	new WOKcommands(client, {
		commandsDir: "commands",
		showWarns: false,
	}).setMongoPath(process.env.MONGO_URI);
	console.log("Bot logged in");
});
