const UserModel = require('./app.model');
const {generateToken, VerifyToken} = require('./app.helper');

class userController{

    async signin(req, res) {
        try {
            let {username, password} = req.body;
             if(!username || username =='' || !password || password =='') return res.json({code : 400, message:'failed', data:null, error:'Incorrect input'});
             // password decrypt
             let result = await UserModel.checkUserCred(username, password);
             if(!result) return res.json({code : 400, message: 'failed', data: null, error : "User not exist"});
             // Return the jwt token
             const [[response]] = await UserModel.getUserData(username);
             const jwtToken = await generateToken(response);
             const data = {
                'username' : response.username,
                'u_id' : response.u_id,
                'type' : response.user_type,
                'token' : jwtToken
             } 
             return res.json({code : 200, message:'success', data:data, error:null});
        } catch (error) {
             res.json({code : 400, message: 'failed', data: null, error: error});
        }
    }

    async signup(req, res) {
        try {
            let {username, password, type} = req.body;
             if(!username || username =='' || !password || password =='' || !type || type =='') return res.json({code : 400, message:'failed', data:null, error:'Incorrect input'});
             let result = await UserModel.checkUserExist(username);
             if(result) return res.json({code : 400, message: 'failed', data: null, error : "User already exist"});
            // password encryption
            await UserModel.insertUser(username, password, +type);
            // check the response and return 
            return res.json({code : 201, message:'success', data:'Successfully created', error:null});
        } catch (error) {
            res.json({code : 400, message: 'failed', data: null, error: error});
        }
    }

    async profile(req, res){
        try {
            const token = req.cookies.authToken;
            const verify = await VerifyToken(req.cookies.authToken);
            const {username,u_id,user_type,current_date_time} = verify.userData;
            let [member] = await UserModel.memberList();
            let [group] = await UserModel.groupList();
            let memberList = ``;
            member.map((val)=>{
                if(val.u_id != u_id) memberList +=`<li>${val?.username?.toUpperCase()} <a href="/message?to=${val?.username}">Send message to ${val?.username}</a></li>`;
            });
            let groupList = ``;
            group.map((val)=>{
                if(val.u_id != u_id) groupList +=`<li>${val?.username?.toUpperCase()} <a href="/message?to=${val?.username}">Send message to ${val?.username}</a></li>`;
            });
             return res.send(`
                   <p>Hii ${username.toUpperCase()}, </p><p style="float:right"><a href="/logout">Logout</a></p>
                  <h1>Select the group or name to start charting : </h1><br>
                  <h3>Member : </h3>
                  <ol>${memberList}</ol>
                  <h3>Group : </h3>
                  <ol>${groupList}</ol>
                `);
        } catch (error) {
            return res.json({code:400, message : 'failed', data: null, error : error});
        }
    }



    logout(req, res){
        try {
            res.clearCookie('authToken');
            return res.redirect('/signin');
        } catch (error) {
            return res.json({code:400, message : 'failed', data: null, error : error});
        }
    }
     

    async sendMessage(auth, message, socket){ 
        if(!auth) return false;
        try {
            const {senderToken, receiverName} = JSON.parse(auth); 
            const verify = await VerifyToken(senderToken);
            const [[receiverInfo]] = await UserModel.getUserData(receiverName);
            const {name:fromName,u_id:fromUserId,user_type:fromUserType,current_date_time:FromCurrentDate} = verify.userData;
            const {name:toName,u_id:toUserId,user_type:toUserType,current_date_time:toCurrentDate} = receiverInfo;
            await UserModel.saveMessage(fromUserId, toUserId, message);
            // get the old messages and send back to the user 
            const [res] = await UserModel.getAllMessages(fromUserId, toUserId);
            return res;
        } catch (error) {
            console.log({code:400, message : 'failed', data: null, error : error});
        }
    }
    
        onMessageHandler = async (socket, message) => {
             try {
                const parsedMessage = JSON.parse(message);
                if (!parsedMessage.type) return socket.disconnect();

                switch (parsedMessage.type) { 
                    case "connection":
                        return userConnection(socket, parsedMessage);

                    case "send_message":
                        return sendMessage(socket, parsedMessage);

                    case "realtime_auth":
                        return realtimeAuth(socket, parsedMessage);

                    default:
                        return socket.emit("error", { message: "Unknown message type" });
                }
            } catch (error) {
                console.error("Error handling message:", error);
                return socket.disconnect();
            }
        };

        onCloseHandler = (socket) => {
            try {
                console.log(`User disconnected: ${socket.id}`); 
                // socket.broadcast.emit("user_disconnected", { userId: socket.id }); 
                // UserController.handleUserDisconnection(socket);
            } catch (error) {
                console.error("Error handling disconnection:", error);
            }
        };
}


let connectedUsers = {};
// socket handle functions 
async function userConnection(socket, parsedMessage) { 
    try {
        let userData = await getConnectedUserDetails(socket);

        const response = {
            message: "Successfully connected!",
            username : userData.userData.username,
            userId: userData.userData.u_id,
            userType: userData.userData.user_type
        };
        connectedUsers[userData.userData.username] = socket.id;
        console.log("User connected:", userData.userData.username);
        socket.emit("connected", response);

        return true;
    } catch (error) {
        console.error("Error in userConnection:", error);
        socket.emit("error", { message: "Server error, please try again later." });
        socket.disconnect();
    }
}
async function sendMessage(socket, parsedMessage) {
    let userData = await getConnectedUserDetails(socket);
    if(!userData) return socket.emit("error", { message: "Server error, please try again later." });
    let receiver = parsedMessage.receiver;
    let data = {
        sender : userData.userData.username,
        receiver,
        message : parsedMessage.message
    }

    // socket.broadcast.emit("user_disconnected", { userId: socket.id });
    // socket.emit("receive_message", data);
    // io.to(groupId).emit("new_message", { senderId, message });
    // io.to(receiverSocketId).emit("new_message", { senderId, message });
    if(!receiver) return socket.emit("error", { message: "Server error, receiver not found." });
    socket.to(connectedUsers[receiver]).emit("receive_message", data);
    console.log('sendMessage', data);
    return true;
}

async function getConnectedUserDetails(socket){
    const cookies = socket.handshake.headers.cookie || "";
        const token = cookies.split("; ").find(row => row.startsWith("authToken="))?.split("=")[1];
        if (!token) {
            console.log("No auth token found, disconnecting...");
            socket.emit("error", { message: "Authentication required!" });
            return socket.disconnect();
        }
 
        const verify = await VerifyToken(token);
        if (!verify || !verify.userData) {
            console.log("Invalid token, disconnecting...");
            socket.emit("error", { message: "Invalid authentication!" });
            return socket.disconnect();
        }

        return verify;
}

module.exports = new userController();