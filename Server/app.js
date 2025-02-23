const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const morgan = require('morgan');
const { createServer } = require("node:http");
const { Server } = require("socket.io");
require("dotenv").config();

const UserController = require("./src/app.controller");
const UserMiddleware = require("./src/app.middleware");
const MongoDB = require('./database/db.mongo');

const app = express();
app.use(express.json());
app.use(cookieParser());
const server = createServer(app);
const io = new Server(server);
 
  
MongoDB.connect(); 
// Logs the rotes 
app.use(morgan('tiny'))
// app.use(morgan(':method :url :status :res[content-length] :response-time ms'))

app.get("/", (req, res) => {
  return res.sendFile(path.join(__dirname, "../Client/welcome.html"));
});
app.get("/signin", (req, res) => {
  return res.sendFile(path.join(__dirname, "../Client/signin.html"));
});
app.get("/signup", (req, res) => {
  return res.sendFile(path.join(__dirname, "../Client/signup.html"));
});
app.post("/signin", UserController.signin);
app.post("/signup", UserController.signup);

app.get("/logout", UserMiddleware.auth, UserController.logout);
app.get("/message", UserMiddleware.auth, (req, res) => {
  return res.sendFile(path.join(__dirname, "../Client/message.html"));
});
app.post("/message", UserMiddleware.auth, UserController.message);
app.get("/profile", UserMiddleware.auth, UserController.profile);

 // Handle WebSocket connections
 io.on("connection", (socket) => {
  let ip = socket.handshake.headers["x-forwarded-for"] || socket.handshake.address;
  console.log(`User IP/ID ${ip}`);

  socket.on("message", (message) => UserController.onMessageHandler(socket, message));
  socket.on("disconnect", () => UserController.onCloseHandler(socket));
});
// setInterval(()=>{
//   const clients = Array.from(io.sockets.sockets.keys());
//     console.log("Connected clients:", clients);
// },2000);

server.listen(process.env.APP_PORT || 7000 , () => {
  console.log(`server listing on port : http://localhost:${process.env.APP_PORT}`);
});
