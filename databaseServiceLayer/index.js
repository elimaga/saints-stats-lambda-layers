const mysql = require('mysql');
const awsSdk = require('aws-sdk');

let dbConnection;

function connectToDatabase(callback) {
    awsSdk.config.update({region: 'us-west-1'});

    const ssm = new awsSdk.SSM();

    const params = {
        Names: ['saintsStatsDbConfig'],
        WithDecryption: true
    };
    ssm.getParameters(params, (err, ssmData) => {
        if (err) {
            callback(err);
            return;
        }

        const saintsStatsDbConfig = JSON.parse(ssmData.Parameters[0].Value);

        dbConnection = mysql.createConnection({
            host: saintsStatsDbConfig.endpoints.angularSaintsStatsDb,
            user: saintsStatsDbConfig.credentials.rdsSaintsStatsData.username,
            password: saintsStatsDbConfig.credentials.rdsSaintsStatsData.password,
            database: saintsStatsDbConfig.credentials.rdsSaintsStatsData.database
        });

        callback();
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
