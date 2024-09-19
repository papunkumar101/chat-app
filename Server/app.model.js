const db = require('./db.mysql');

class UserModel{
    async checkUserExist(user) {
       const [row] = await db.query('SELECT u_id FROM user WHERE name=?',[user]); 
       return row.length > 0 ? true : false;
    }

    async checkUserCred(user,pass) {
       const [row] = await db.query('SELECT u_id FROM user WHERE name=? AND password=?',[user,pass]); 
       return row.length > 0 ? true : false;
    }

    async insertUser(user, pass, type) {
      return await db.query('INSERT INTO user(name, password, user_type) VALUES(?,?,?)', [user, pass, type]);  
    }

    async getUserData(user){
       return await db.query('SELECT * FROM user WHERE name=?',[user]); 
    }

    async memberList(){
       return await db.query('SELECT u_id,name FROM user WHERE user_type=1'); 
    }
    async groupList(){
       return await db.query('SELECT u_id,name FROM user WHERE user_type=2'); 
    }

    async saveMessage(fromUserId, toUserId, message){
      return db.query('INSERT INTO chat_messages(u_from, u_to, message) VALUES(?,?,?)',[fromUserId, toUserId, message]);
    }

    async getAllMessages(fromUserId, toUserId){
      return db.query('SELECT u_from, u_to, message FROM chat_messages WHERE u_from=? AND u_to=?',[fromUserId, toUserId]);
    }
}

module.exports = new UserModel();