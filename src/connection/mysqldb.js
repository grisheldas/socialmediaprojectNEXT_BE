const mysql = require("mysql2");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "amebapico",
  database: "mydb",
  connectionLimit: 10,
  port: 3306,
});

db.getConnection((err, conn) => {
  if (err) {
    console.log("error");
  }
  console.log(`connected as id ${conn.threadId}`);
});

module.exports = db;
