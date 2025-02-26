const db = require('./../database/db.mysql');
const messageSchema = require('./../database/message.schema');

class UserModel{
    async checkUserExist(user) {
       const [row] = await db.query('SELECT u_id FROM user WHERE username=?',[user]); 
       return row.length > 0 ? true : false;
    }

    async checkUserCred(user,pass) {
       const [row] = await db.query('SELECT u_id FROM user WHERE username=? AND password=?',[user,pass]); 
       return row.length > 0 ? true : false;
    }

    async insertUser(user, pass, type) {
      return await db.query('INSERT INTO user(username, password, user_type) VALUES(?,?,?)', [user, pass, type]);  
    }

    async getUserData(user){
       return await db.query('SELECT * FROM user WHERE username=?',[user]); 
    }

    async memberList(){
       return await db.query('SELECT u_id,username FROM user WHERE user_type=1'); 
    }
    async groupList(){
       return await db.query('SELECT u_id,username FROM user WHERE user_type=2'); 
    }

    async saveMessage({sender, receiver, message}){
      // return db.query('INSERT INTO chat_messages(u_from, u_to, message) VALUES(?,?,?)',[fromUserId, toUserId, message]);
      return new messageSchema({ sender_id:sender, receiver_id:receiver, message_text:message}).save();
    }

    async getAllMessages(fromUserId, toUserId){
      return db.query('SELECT u_from, u_to, message FROM chat_messages WHERE u_from=? AND u_to=?',[fromUserId, toUserId]);
    }

    async collectChat(sender, receiver){
      return await messageSchema.aggregate([
         {
             $match: {
                 $or: [
                     { sender_id: sender, receiver_id: receiver },
                     { sender_id: receiver, receiver_id: sender }
                 ]
             }
         },
         {
             $project: {
                 sender_id: 1,
                 receiver_id: 1,
                 message_text: 1,
                 createdAt: 1
             }
         },
         { $sort: { createdAt: -1 } }
     ]);
    }
}

module.exports = new UserModel();