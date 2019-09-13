const sinon = require('sinon');

function awsMocks() {
    const awsSdkMock = {
        config: {
            update: sinon.spy()
        },
        SSM: sinon.spy(function () {
            return ssmMock;
        })
    };

    const ssmMock = {
        getParameters: sinon.spy()
    };

    return {
        awsSdkMock,
        ssmMock
    }
}

module.exports = awsMocks;
