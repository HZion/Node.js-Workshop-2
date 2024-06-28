const dotenv = require('dotenv').config();
const mysql = require('mysql2');

let mysqldb;

const setup = async () => {
    if (mysqldb) {
        return {mysqldb};
    }

    try {        
        mysqldb = mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB,
        });
        mysqldb.connect();
        console.log("MySQL 접속 성공.");
        return { mysqldb };
    } catch (err) {
        console.error('DB 접속 실패', err);
        throw err;  // 접속에 실패한다면 서버 가동을 할 수 없게 함
    }
};

module.exports = { setup };