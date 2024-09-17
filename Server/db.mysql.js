const mysql = require('mysql2');

// Connection pool 
const db = mysql.createPool({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'chatApp'
});

// Check the connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL!');
    connection.release();
})

module.exports = db;
// import it and using db.query("....") you can access the database