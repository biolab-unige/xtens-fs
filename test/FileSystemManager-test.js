var expect = require('chai').expect;
var sinon = require('sinon');
var dependencies = {};
dependencies.IrodsRestStrategy = require('./../lib/IrodsRestStrategy.js');
var FileSystemManager = require('./../lib/FileSystemManager.js');

var opts = {
    type: 'irods-rest',
    irodsHome: '/testZone/home/test',
    landingCollection: 'landing',
    repoCollection: 'repo',
    restURL: {
        hostname: 'http://someaddress',
        port: 8080,  // default tomcat port
        path: '/irods-rest/rest'
    },
    username: 'user',
    password: 'passw'
};

describe('#FileSystemManager', function() {

    describe('#constructor', function() {

        it("#should create a FileSystemManager with a irodsRest Strategy", function() {
            // TODO how can i mock/stub the dependency
            // var mock = sinon.stub(dependencies, 'IrodsRestStrategy');
            var manager = new FileSystemManager(opts);
            expect(manager).to.exist;
            expect(manager.strategy).to.be.instanceof(dependencies.IrodsRestStrategy);
            // mock.restore();
        });
    });

});
