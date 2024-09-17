const db = require('./db.mysql');

class UserModel{
    async checkUserExist(user) {
      return await db.query(`SELECT id FROM user WHERE name = ${user}`);  
    }

    async insertUser(user, pass) {
      return await db.query(`INSERT INTO user(name, user_type) VALUES(${user},${pass})`);  
    }
}

module.exports = new UserModel();