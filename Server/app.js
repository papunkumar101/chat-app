const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const { createServer } = require("node:http");
const { Server } = require("socket.io");

const UserController = require("./app.controller");
const UserMiddleware = require("./app.middleware");

const app = express();
app.use(express.json());
app.use(cookieParser());
const server = createServer(app);
const io = new Server(server);
const port = 3000;

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

app.get("/profile", UserMiddleware.auth, UserController.profile);
app.get("/logout", UserMiddleware.auth, UserController.logout);
app.get("/message", UserMiddleware.auth, (req, res) => {
  return res.sendFile(path.join(__dirname, "../Client/message.html"));
});


const connectedUsers = {};
 io.on("connection", (socket) => {
     console.log("A user connected");  
 
    // Handshak or get the 'to' user details
    socket.on("auth", (auth) => {
        socket.auth = auth;
        connectedUsers[auth] = socket;
      });
      
     socket.on("chat message", async (msg) => {
      try { 
        let save = await UserController.sendMessage(socket.auth, msg, socket);
        if(!save){
            console.error("Something went wrong....");
            return false; 
        }
        console.log('save',save,connectedUsers);

        if (connectedUsers[auth]) {
            connectedUsers[auth].emit("receive message", { 
                save
            }); 
          }
         // let dummy = { senderID: 123, receiverID: 121, message: "Hello Papun", type: "text" };
        // if(connectedUser[dummy.receiverID]) 
        // connectedUser[dummy.receiverID].send(JSON.stringify({ senderID: 123, receiverID: 121, message: "Hello Papun", type: "text"}))
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });
  
    //  socket.on("disconnect", () => {
    //   if (socket.userId) {
    //     delete connectedUsers[socket.userId];
    //     console.log(`User ${socket.userId} disconnected`);
    //   }
    // });
  });


server.listen(port, () => {
  console.log(`server listing on port : ${port}`);
});
