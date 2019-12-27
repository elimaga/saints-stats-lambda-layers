const basedir = '../databaseServiceLayer';
const assert = require('assert');
const mockery = require('mockery');
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

            databaseServiceLayer.connectToDatabase();

            assert.strictEqual(dbMocks.mySqlMock.createConnection.callCount, 1);
            assert.deepStrictEqual(dbMocks.mySqlMock.createConnection.args[0][0], expectedDatabaseConnectionData);
        });
    });

    describe('query', () => {
        beforeEach(() => {
            databaseServiceLayer.connectToDatabase();
        });

        it('should use the database connection to query the database', (done) => {
            const queryString = 'This is some sql query';
            const queryArgs = ['this is the first arg', 2];
            let queryData = 'this is some fake data';

            databaseServiceLayer.query(queryString, queryArgs)
                .then((data) => {
                    assert.strictEqual(data, queryData);
                    done();
                })
                .catch((err) => {
                    assert.fail('This test should not throw an error: ' + err)
                });

            assert.strictEqual(dbMocks.dbConnectionMock.query.callCount, 1);
            assert.strictEqual(dbMocks.dbConnectionMock.query.args[0][0], queryString);
            assert.strictEqual(dbMocks.dbConnectionMock.query.args[0][1], queryArgs);

            const queryCallback = dbMocks.dbConnectionMock.query.args[0][2];
            queryCallback(null, queryData);
        });

        it('should return an error if the db query returned an error', (done) => {
            const queryString = 'This is some sql query';
            const queryArgs = ['this is the first arg', 2];
            let queryErr = 'this is some fake error';

            databaseServiceLayer.query(queryString, queryArgs)
                .then((data) => {
                    assert.fail('This test should have thrown an error: ' + data)
                })
                .catch((err) => {
                    assert.equal(err, queryErr)
                    done();
                });

            assert.strictEqual(dbMocks.dbConnectionMock.query.callCount, 1);
            assert.strictEqual(dbMocks.dbConnectionMock.query.args[0][0], queryString);
            assert.strictEqual(dbMocks.dbConnectionMock.query.args[0][1], queryArgs);

            const queryCallback = dbMocks.dbConnectionMock.query.args[0][2];
            queryCallback(queryErr);
        });
    });

    describe('disconnectDb', () => {
        it('should disconnect from the database if there is a connection', () => {
            databaseServiceLayer.connectToDatabase();

            databaseServiceLayer.disconnectDb();

            assert.strictEqual(dbMocks.dbConnectionMock.end.callCount, 1);
        });

        it('should not disconnect from the database if there is no connection', () => {
            databaseServiceLayer.disconnectDb();

            assert.strictEqual(dbMocks.dbConnectionMock.end.callCount, 0);
        });
    });
});
