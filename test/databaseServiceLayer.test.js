const basedir = '../databaseServiceLayer';
const assert = require('assert');
const mockery = require('mockery');
const sinon = require('sinon');
const dbMocksConstructor = require('./mocks/dbMocks');

describe('Database Service Layer Test', () => {
    let databaseServiceLayer;
    let dbMocks;

    beforeEach(() => {
        mockery.enable({
            useCleanCache: true,
            warnOnReplace: true,
            warnOnUnregistered: false
        });

        dbMocks = dbMocksConstructor();

        mockery.registerMock('./saintsStatsDbConfig.json', dbMocks.saintsStatsDbConfigMock);
        mockery.registerMock('mysql', dbMocks.mySqlMock);
        databaseServiceLayer = require(`${basedir}/index`);
    });

    afterEach(() => {
        mockery.deregisterAll();
        mockery.disable();
    });

    describe('connectToDatabase', () => {
        it('should connect to the database using the correct credentials', () => {
            const expectedDatabaseConnectionData = {
                host: dbMocks.saintsStatsDbConfigMock.endpoints.angularSaintsStatsDb,
                user: dbMocks.saintsStatsDbConfigMock.credentials.rdsSaintsStatsData.username,
                password: dbMocks.saintsStatsDbConfigMock.credentials.rdsSaintsStatsData.password,
                database: dbMocks.saintsStatsDbConfigMock.credentials.rdsSaintsStatsData.database
            };
            const connectToDatabaseCallback = sinon.spy();

            databaseServiceLayer.connectToDatabase(connectToDatabaseCallback);

            assert.strictEqual(dbMocks.mySqlMock.createConnection.callCount, 1);
            assert.deepStrictEqual(dbMocks.mySqlMock.createConnection.args[0][0], expectedDatabaseConnectionData);
            assert.strictEqual(connectToDatabaseCallback.callCount, 1);
        });
    });

    describe('query', () => {
        beforeEach(() => {
            databaseServiceLayer.connectToDatabase(() => {});
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
            databaseServiceLayer.connectToDatabase(() => {});

            databaseServiceLayer.disconnectDb();

            assert.strictEqual(dbMocks.dbConnectionMock.end.callCount, 1);
        });

        it('should not disconnect from the database if there is no connection', () => {
            databaseServiceLayer.disconnectDb();

            assert.strictEqual(dbMocks.dbConnectionMock.end.callCount, 0);
        });
    });
});
