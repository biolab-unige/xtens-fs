var expect = require("chai").expect;
var sinon = require("sinon");
var IrodsRestStrategy = require("../lib/IrodsRestStrategy.js");

var opts = {
    type: 'irodsRest',
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

var fileName = 'fileName.extension'; 
var idData = 1;
var dataTypeName = 'testDataType';


// just am empty callback
function testCallback() {
    console.log("called");
} 

describe("#IrodsRestStrategy", function() {
    
    describe("#constructor", function() {
        
        it("should instantiate a new IrodsRestStrategy object if options are provided", function() {
            var strategy = new IrodsRestStrategy(opts);
            expect(strategy).to.be.instanceof(IrodsRestStrategy);
            expect(strategy.irodsHome).to.equal(opts.irodsHome);
            expect(strategy.landingCollection).to.equal(opts.landingCollection);
            expect(strategy.repoCollection).to.equal(opts.repoCollection);
            expect(strategy.restURL).to.eql(opts.restURL);
            expect(strategy.username).to.equal(opts.username);
            expect(strategy.password).to.equal(opts.password);
        });

    });

    describe("#editDataFile", function() {

        var strategy = new IrodsRestStrategy(opts);

        before(function() {
            this.testCallback = testCallback;
        });

        it("should edit a Data File instance removing the name and creating the URI property", function() {
            var file = { name: fileName};
            var spy = sinon.spy(this, "testCallback");
            strategy.editDataFile(file, idData, dataTypeName, spy);
            expect(file).to.not.have.property('name');
            var uri = opts.irodsHome + "/" + opts.repoCollection + "/" + dataTypeName + "/" + idData + "/" + fileName;
            expect(file.uri).to.equal(uri);
            console.log(spy.callCount);
            expect(spy.called).to.be.true;
            expect(spy.calledOnce).to.be.true;
        });
    
    });

    describe("#storeFile", function() {

        var strategy = new IrodsRestStrategy(opts);
        
        before(function() {
            this.server = sinon.fakeServer.create();
            this.testCallback = testCallback;
        });

        after(function() {
            this.server.restore();
        });

        beforeEach(function() {
            var url = opts.restURL.hostname + ":" + opts.restURL.port + opts.restURL.path + "/rule";
            console.log(url); 
            var response = '[200, {"Content-Type": "application/json"}, {"outputParameterResults": []}]';  // response status, header & body
            this.server.respondWith("POST", url, response);
            this.stub = sinon.stub(strategy, 'editDataFile');
            this.stub.returns(undefined);
        });

        it("should successfully store a file at a path specified by Data ID and DataType name", function() {
            var file = { name: fileName};
            strategy.storeFile(file, idData, dataTypeName, testCallback);
            this.server.respond();
            // expect(this.stub.calledOnce).to.be.true;
        });
    
    });

});
