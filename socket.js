const Chats = require("./models/chats");
const Redis = require("ioredis");
const redis = new Redis();
const WebSocket = require("ws");

let i = 0;
let lookup = {};

function makeServer(server) {
  const wss = new WebSocket.Server({ server: server, path: "/ws" });
  wss.on("connection", function connection(ws, req) {
    console.log("A connection has arrived. ");
    ws.id = i++;
    try {
      const username = req.url.split("?")[1].split("=")[1];
      console.log(username);
      lookup[ws.id] = ws;
      redis.set(username, ws.id);
      ws.on("message", function incoming(message) {
        console.log("received: %s", message);

        try {
          var json = JSON.parse(message);
          switch (json.action) {
            case "privateMessage":
              storeMessage(json);
              // saved message to db, now pushing to other receiver client
              redis.get(json.receiver, function (err, receiverWSID) {
                if (err) {
                  console.error(err);
                } else {
                  lookup[receiverWSID].send(
                    JSON.stringify({
                      sender: json.sender,
                      receiver: json.receiver,
                      message: json.message,
                      chatID: json.chatID,
                      time: Date.now().toString(),
                    })
                  ); // Promise resolves to "bar"
                }
              });
              break;
            default:
              break;
          }
        } catch (err) {
          console.log(err);
          //console.error("Error parsing json: Bruhhhhhh what is that json");
        }
      });
    } catch (err) {
      console.log(err);
    }
  });
}

function storeMessage(json) {
  try {
    const { sender, receiver, message, chatID } = json;
    //console.log({ sender, receiver, message, chatID });
    if (
      sender == undefined ||
      chatID == undefined ||
      receiver == undefined ||
      message == undefined
    )
      throw err;
    else {
      //do stuff here,sexy beast
      Chats.updateOne(
        { chatID: chatID },
        {
          $push: {
            messages: {
              sender: sender,
              receiver: receiver,
              message: message,
              chatID: chatID,
              time: Date.now().toString(),
            },
          },
        }
      )
        .then((res) => console.log(res))
        .catch((err) => console.log(err));
    }
  } catch (err) {
    console.log(err);

    // console.error(
    //   "Error in parsing json: Bro your payload in private message doesnot have one of these: sender,receiver, message or chatID"
    // );
  }
}

module.exports = makeServer;
