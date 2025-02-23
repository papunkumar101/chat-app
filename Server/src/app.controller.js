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

    async message(req, res){
        try {
            const token = req.cookies.authToken;
            const verify = await VerifyToken(req.cookies.authToken);
            const {username,u_id,user_type,current_date_time} = verify.userData;
            let [member] = await UserModel.memberList();
            let [group] = await UserModel.groupList(); 
            let data  = {
                username : username,
                u_id : u_id,
                user_type : user_type,
                current_date_time : current_date_time,
                member : member,
                group : group
            };

            return res.json({code:200, message : 'success', data, error : null});  
        } catch (error) {
            return res.json({code:400, message : 'failed', data: null, error : error});
        }
    }



    profile(req, res){
        try { 
            return true;
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
                handleUserDisconnection(socket, socket.id);
            } catch (error) {
                console.error("Error handling disconnection:", error);
            }
        };
}


// socket handle functions 
let connectedUsers = {};
let onlineOfflineStatusOfUsers = {};
async function userConnection(socket, parsedMessage) { 
    try {
        let userData = await getConnectedUserDetails(socket);
        if(!userData.userData.username || !parsedMessage.receiver) socket.emit("error", { message: "Sender or receiver is invalid" });
        const response = {
            message: "Successfully connected!",
            username : userData.userData.username,
            userId: userData.userData.u_id,
            userType: userData.userData.user_type
        };
        connectedUsers[userData.userData.username] = socket.id;
        onlineOfflineStatusOfUsers[userData.userData.username] = 1;
        collectAndSendLastConversession(socket, userData.userData.username, parsedMessage.receiver);
        socket.emit("connected", response);
        console.log("Connected users:", connectedUsers);
    } catch (error) {
        console.error("Error in userConnection:", error);
        socket.emit("error", { message: "Server error, please try again later." });
        socket.disconnect();
    }
}

// Collect the chats between sender and receiver in (merge  DESC   time wise)
async function collectAndSendLastConversession(socket, username, receiver) {
    let chats = await UserModel.collectChat(username, receiver); 
    socket.emit("user_online_offline_status", onlineOfflineStatusOfUsers);
    if(chats){
        socket.emit("last_conversation", chats);
        // socket.to(connectedUsers[userData.userData.username]).emit("last_conversation", chats);
    }
    return true;
}


async function sendMessage(socket, parsedMessage) {
    let userData = await getConnectedUserDetails(socket);
    if(!userData) return socket.emit("error", { message: "Server error, please try again later." });
    let receiver = parsedMessage.receiver;
    if(!receiver) return socket.emit("error", { message: "Server error, receiver not found." });
    let data = {
        sender : userData.userData.username,
        receiver,
        message : parsedMessage.message
    }
    await UserModel.saveMessage(data);
    // socket.broadcast.emit("user_disconnected", { userId: socket.id });
    // socket.emit("receive_message", data);
    // io.to(groupId).emit("new_message", { senderId, message });
    // io.to(receiverSocketId).emit("new_message", { senderId, message });
    socket.to(connectedUsers[receiver]).emit("receive_message", data);
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



function handleUserDisconnection(socket, id){
    let username = Object.entries(connectedUsers).find(([key, value]) => value === id)?.[0]; 
    onlineOfflineStatusOfUsers[username] = 0;
    return socket.broadcast.emit("user_online_offline_status", onlineOfflineStatusOfUsers); 
}

module.exports = new userController();