const mysql = require('mysql2/promise');

// Connection pool 
const db = mysql.createPool({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'chatApp'
});


// Connect and check the connection with promise
(async () => {
    try {
         const connection = await db.getConnection();
         console.log('Connected to MySQL!'); 
         connection.release();
    } catch (err) {
        console.error('Error connecting to MySQL:', err.message);
    }
})();

module.exports = db;
// import it and using db.query("....") you can access the database