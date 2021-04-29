const mongoose = require("mongoose");

mongoose.connect(`mongodb://localhost:27017/${process.env.DBNAME}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const http = require("http");
const express = require("express");
const app = express();
const morgan = require("morgan");
const chatRoutes = require("./routes/chatRoutes");

app.use(express.json());
app.use(morgan("tiny"));

app.use("/", chatRoutes);

const server = http.createServer(app);
const makeServer = require("./socket");
makeServer(server);

server.listen(5001, () => {
  console.log("Listening on 5001");
});
