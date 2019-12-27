const mysql = require('mysql');
const saintsStatsDbConfig = require('./saintsStatsDbConfig.json');

let dbConnection;

function connectToDatabase() {
    dbConnection = mysql.createConnection({
        host: saintsStatsDbConfig.endpoints.angularSaintsStatsDb,
        user: saintsStatsDbConfig.credentials.rdsSaintsStatsData.username,
        password: saintsStatsDbConfig.credentials.rdsSaintsStatsData.password,
        database: saintsStatsDbConfig.credentials.rdsSaintsStatsData.database
    });
}

function query(sql, params, callback) {
    dbConnection.query(sql, params, callback);
}

function disconnectDb() {
    if (dbConnection) {
        dbConnection.end();
    }
}

module.exports = {
    connectToDatabase,
    query,
    disconnectDb
};
