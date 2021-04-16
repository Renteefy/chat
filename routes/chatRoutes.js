const express = require("express");
const nanoid = require("nanoid");
const router = express.Router();
const chatRoom = require("../models/chatRooms");
const chat = require("../models/chats");

function genChatID() {
  return nanoid.nanoid();
}

router.get("/test", (req, res) => res.send("cum on bbg 💦"));

router.post("/chatRoom", (req, res) => {
  const user1 = req.body.user1;
  const user2 = req.body.user2;
  const chatID = genChatID();
  console.log(user1);
  chatRoom.findOne(
    {
      $or: [
        { user1: user1, user2: user2 },
        { user1: user2, user2: user1 },
      ],
    },
    (err, doc) => {
      if (err) res.send("errrrrror bruh. we are down");
      else {
        if (doc === null) {
          // init the chatroom and chat
          let chatInit = new chat({ chatID: chatID, messages: [] });
          let chatRoomInit = new chatRoom({
            chatID: chatID,
            user1: user1,
            user2: user2,
          });
          chatInit.save();
          chatRoomInit.save();
          res.send({ chatID: chatID, user1: user1, user2: user2 });
        } else {
          res.send({
            user1: doc.user1,
            user2: doc.user2,
            chatID: doc.chatID,
            red: true,
          });
        }
      }
    }
  );
});
router.get("/userchatRoom/:username", (req, res) => {
  const username = req.params.username;
  chatRoom.find(
    {
      $or: [{ user1: username }, { user2: username }],
    },
    (err, docs) => {
      if (err) res.send("errrrrror bruh. we are down");
      else {
        res.send(docs);
      }
    }
  );
});

module.exports = router;
