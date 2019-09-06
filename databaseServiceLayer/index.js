const mysql = require('mysql');
const saintsStatsDbConfig = require('./saintsStatsDbConfig.json');

let dbConnection;

function connectToDatabase(callback) {
    dbConnection = mysql.createConnection({
        host: saintsStatsDbConfig.endpoints.angularSaintsStatsDb,
        user: saintsStatsDbConfig.credentials.rdsSaintsStatsData.username,
        password: saintsStatsDbConfig.credentials.rdsSaintsStatsData.password,
        database: saintsStatsDbConfig.credentials.rdsSaintsStatsData.database
    });

    callback();
}

function query(sql, params, callback) {
    dbConnection.query(sql, params, callback);
}

module.exports = {
    connectToDatabase,
    query
};
