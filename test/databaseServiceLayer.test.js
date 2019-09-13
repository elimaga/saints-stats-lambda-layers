const basedir = '../databaseServiceLayer';
const assert = require('assert');
const mockery = require('mockery');
const sinon = require('sinon');
const dbMocksConstructor = require('./mocks/dbMocks');
const awsMocksConstructor = require('./mocks/awsMocks');

describe('Database Service Layer Test', () => {
    let databaseServiceLayer;
    let dbMocks;
    let awsMocks;

    beforeEach(() => {
        mockery.enable({
            useCleanCache: true,
            warnOnReplace: true,
            warnOnUnregistered: false
        });

        dbMocks = dbMocksConstructor();
        awsMocks = awsMocksConstructor();

        mockery.registerMock('./saintsStatsDbConfig.json', dbMocks.saintsStatsDbConfigMock);
        mockery.registerMock('mysql', dbMocks.mySqlMock);
        mockery.registerMock('aws-sdk', awsMocks.awsSdkMock);
        databaseServiceLayer = require(`${basedir}/index`);
    });

    afterEach(() => {
        mockery.deregisterAll();
        mockery.disable();
    });

    function successfullyConnectToDatabase() {
        databaseServiceLayer.connectToDatabase(() => {
        });
        const getParametersCallback = awsMocks.ssmMock.getParameters.args[0][1];
        let getSaintsStatsDbConfigParameterData = {
            Parameters: [{
                Value: JSON.stringify(dbMocks.saintsStatsDbConfigMock)
            }]
        };
        getParametersCallback(null, getSaintsStatsDbConfigParameterData);
    }

    describe('connectToDatabase', () => {
        it('should attempt to get the parameter from SSM', () => {
            const connectToDatabaseCallback = sinon.spy();

            databaseServiceLayer.connectToDatabase(connectToDatabaseCallback);

            assert.strictEqual(awsMocks.awsSdkMock.config.update.callCount, 1);
            assert.deepStrictEqual(awsMocks.awsSdkMock.config.update.args[0][0], {region: 'us-west-1'});
            assert(awsMocks.awsSdkMock.SSM.calledWithNew());
            assert.strictEqual(awsMocks.ssmMock.getParameters.callCount, 1);
            const expectedParams = {
                Names: ['saintsStatsDbConfig'],
                WithDecryption: true
            };
            assert.deepStrictEqual(awsMocks.ssmMock.getParameters.args[0][0], expectedParams);
        });

        it('should connect to the database once we get the credentials', () => {
            const expectedDatabaseConnectionData = {
                host: dbMocks.saintsStatsDbConfigMock.endpoints.angularSaintsStatsDb,
                user: dbMocks.saintsStatsDbConfigMock.credentials.rdsSaintsStatsData.username,
                password: dbMocks.saintsStatsDbConfigMock.credentials.rdsSaintsStatsData.password,
                database: dbMocks.saintsStatsDbConfigMock.credentials.rdsSaintsStatsData.database
            };
            const connectToDatabaseCallback = sinon.spy();

            databaseServiceLayer.connectToDatabase(connectToDatabaseCallback);

            successfullyConnectToDatabase();

            assert.strictEqual(dbMocks.mySqlMock.createConnection.callCount, 1);
            assert.deepStrictEqual(dbMocks.mySqlMock.createConnection.args[0][0], expectedDatabaseConnectionData);
            assert.strictEqual(connectToDatabaseCallback.callCount, 1);
            assert.strictEqual(connectToDatabaseCallback.args[0][0], undefined);
        });

        it('should not connect to the database if there is an error getting the parameter', () => {
            const connectToDatabaseCallback = sinon.spy();

            databaseServiceLayer.connectToDatabase(connectToDatabaseCallback);

            const getParametersCallback = awsMocks.ssmMock.getParameters.args[0][1];
            let getParametersErr = new Error('this is the error with get parameters');
            getParametersCallback(getParametersErr);

            assert.strictEqual(dbMocks.mySqlMock.createConnection.callCount, 0);
            assert.strictEqual(connectToDatabaseCallback.callCount, 1);
            assert.strictEqual(connectToDatabaseCallback.args[0][0], getParametersErr);
        });
    });

    describe('query', () => {
        beforeEach(() => {
            successfullyConnectToDatabase();
        });

        it('should use the database connection to query the database', () => {
            const queryString = 'This is some sql query';
            const queryArgs = ['this is the first arg', 2];
            const dbQueryCallback = sinon.spy();

            databaseServiceLayer.query(queryString, queryArgs, dbQueryCallback);

            assert.strictEqual(dbMocks.dbConnectionMock.query.callCount, 1);
            assert.strictEqual(dbMocks.dbConnectionMock.query.args[0][0], queryString);
            assert.strictEqual(dbMocks.dbConnectionMock.query.args[0][1], queryArgs);

            let queryErr = 'this is some fake error';
            let queryData = 'this is some fake data';
            const queryCallback = dbMocks.dbConnectionMock.query.args[0][2];
            queryCallback(queryErr, queryData);

            assert.strictEqual(dbQueryCallback.callCount, 1);
            assert.strictEqual(dbQueryCallback.args[0][0], queryErr);
            assert.strictEqual(dbQueryCallback.args[0][1], queryData);
        });
    });

    describe('disconnectDb', () => {
        it('should disconnect from the database if there is a connection', () => {
            successfullyConnectToDatabase();

            databaseServiceLayer.disconnectDb();

            assert.strictEqual(dbMocks.dbConnectionMock.end.callCount, 1);
        });

        it('should not disconnect from the database if there is no connection', () => {
            databaseServiceLayer.disconnectDb();

            assert.strictEqual(dbMocks.dbConnectionMock.end.callCount, 0);
        });
    });
});
