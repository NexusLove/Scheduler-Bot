const mongoose = require("mongoose");

const scheduledMessage = new mongoose.Schema({
	date: {
		type: Date,
		required: true,
	},
	content: {
		type: String,
		required: true,
	},
	guildId: {
		type: String,
		required: true,
	},
	channelId: {
		type: String,
		required: true,
	},
});

const name = "scheduledMessages";

module.exports =
	mongoose.model[name] || mongoose.model(name, scheduledMessage, name);
