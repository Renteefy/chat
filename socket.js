const Chats = require("./models/chats");
const Redis = require("ioredis");
const redis = new Redis({ port: 6379 });
const WebSocket = require("ws");
const nanoid = require("nanoid");

const admin = require("firebase-admin");
const serviceAccount = require("./../renteefy-notification-system-firebase-adminsdk-z3xwc-6e9407d43a.json");
const Users = require("./models/users");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const firestore = admin.firestore();

// dont copy paste this method. Mongoose model is not defined for this model
// thus it returns the user obj but does not let us use its properties
// thats why the parsing stringify
const getEmailfromUsername = async (username) => {
  let user = await Users.findOne({ username });
  return JSON.parse(JSON.stringify(user)).email;
};

function makeServer(server) {
  const wss = new WebSocket.Server({ server: server, path: "/ws" });
  wss.on("connection", async function connection(ws, req) {
    //console.log("A connection has arrived. ");
    ws.id = nanoid.nanoid();
    try {
      const username = req.url.split("?")[1].split("=")[1];
      //console.log(username);
      //console.log(await getUserObjfromUsername(username));
      //const notifiuser = await getUserObjfromUsername(username);
      //const token = await firestore.collection("users").doc(user.email).get();

      redis.set(username, ws.id);
      ws.on("message", async function incoming(message) {
        //console.log("received: %s", message);
        try {
          let json = JSON.parse(message);

          // notification setup
          let email = await getEmailfromUsername(json.receiver);
          const token = await firestore.collection("users").doc(email).get();
          //console.log(token.data().token);
          const notification_options = {
            priority: "high",
            timeToLive: 60 * 60 * 24,
          };
          const notifimessage = {
            notification: {
              title: "New Message 📪",
              body: json.sender + " has sent you a message",
            },
          };
          // end of notification setup

          switch (json.action) {
            case "privateMessage":
              storeMessage(json);
              // saved message to db, now pushing to other receiver client
              redis.get(json.receiver, function (err, receiverWSID) {
                if (err) {
                  console.error(err);
                } else {
                  // notify the receiver (firebase)
                  admin
                    .messaging()
                    .sendToDevice(
                      token.data().token,
                      notifimessage,
                      notification_options
                    )
                    .then((response) => {
                      console.log("notification sent");
                    })
                    .catch((error) => {
                      console.log(
                        "couldnt send notification : error : " + error
                      );
                    });
                  //send message to receiver (custom server)
                  wss.clients.forEach(function each(client) {
                    if (
                      client.readyState === WebSocket.OPEN &&
                      client.id === receiverWSID
                    ) {
                      client.send(
                        JSON.stringify({
                          sender: json.sender,
                          receiver: json.receiver,
                          message: json.message,
                          chatID: json.chatID,
                          time: Date.now().toString(),
                        })
                      );
                    }
                  });
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
      console.log({ err, error: "cant find username in the url" });
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
