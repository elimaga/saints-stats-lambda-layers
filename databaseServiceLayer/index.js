const mysql = require('mysql');
const saintsStatsDbConfig = require('./saintsStatsDbConfig.json');

function connectToDatabase(callback) {
    mysql.createConnection({
        host: saintsStatsDbConfig.endpoints.angularSaintsStatsDb,
        user: saintsStatsDbConfig.credentials.rdsSaintsStatsData.username,
        password: saintsStatsDbConfig.credentials.rdsSaintsStatsData.password,
        database: saintsStatsDbConfig.credentials.rdsSaintsStatsData.database
    });

    callback();
}

module.exports = {
    connectToDatabase
};
