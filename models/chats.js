const mongoose = require("mongoose");

const chatSchema = mongoose.Schema({
  chatID: { type: String, required: true },
  messages: [
    {
      sender: String,
      message: String,
      time: String,
      receiver: String,
    },
  ],
});

module.exports = mongoose.model("Chats", chatSchema);
