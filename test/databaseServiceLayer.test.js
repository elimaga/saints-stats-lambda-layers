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
});
