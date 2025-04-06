const mysql = require('mysql2/promise');

// Connection pool 
const db = mysql.createPool({
    host : process.env.MYSQL_HOST,
    user : process.env.MYSQL_USERNAME,
    password : process.env.MYSQL_PASSWORD,
    database : process.env.MYSQL_DBNAME,
    port : process.env.MYSQL_PORT
});


// Connect and check the connection with promise
(async () => {
    try {
         const connection = await db.getConnection();
         console.log('== MySQL Connected =='); 
         connection.release();
    } catch (err) {
        console.error('Error connecting to MySQL:', err.message);
    }
})();

module.exports = db;
// import it and using db.query("....") you can access the database