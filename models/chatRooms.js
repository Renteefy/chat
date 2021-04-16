const mongoose = require("mongoose");

const chatroomSchema = mongoose.Schema({
  user1: String,
  user2: String,
  chatID: { type: String, required: true },
});

module.exports = mongoose.model("Chatrooms", chatroomSchema);
