var expect = require("chai").expect,
    sinon = require("sinon"),
    BluebirdPromise = require("bluebird"),
    fs = BluebirdPromise.promisifyAll(require('fs')),
    LocalFileSystemStrategy = require("../lib/LocalFileSystemStrategy");

var opts = {
    type: 'localFileSystem',
    path: '/var/xtens/data-files',
    landingDirectory: '/path/to/landing',
    repoDirectory: 'repo'
};

var fileName = "file.extension";
var fileAbsPath = "/absolute/path/to/file.extension";
var idData = 1;
var dataTypeName = 'testDataType';

// just am empty callback
function testCallback() {
    console.log("called");
}

describe("#LocalFileSystemStrategy", function() {

    describe("#constructor", function() {
        
        it("should instantiate a new LocalFileSystemStrategy object if options are provided", function() {
            var strategy = new LocalFileSystemStrategy(opts);
            expect(strategy).to.be.instanceof(LocalFileSystemStrategy);
            expect(strategy.path).to.equal(opts.path);
            expect(strategy.landingDirectory).to.equal(opts.landingDirectory);
            expect(strategy.repoDirectory).to.equal(opts.repoDirectory);
        });

    });

    describe("#editDataFile", function() {
        // TODO
    });

    describe("#storeFile", function() {

        var strategy = new LocalFileSystemStrategy(opts);

        before(function() {
            this.testCallback = testCallback;
        });

        beforeEach(function() {
            //TODO
            this.stub = sinon.stub(fs, "rename");
        });
        
        afterEach(function() {
            this.stub.restore();
        });

        it("should move the file to it final local destination", function() {
            var file = {name: fileName};
            strategy.storeFile(file, idData, dataTypeName, testCallback);
            expect(this.stub.calledOnce).to.be.true;
            var stubCall = this.stub.getCall(0);
            console.log(stubCall);
            // TODO fix this test
            // expect(stubCall.calledWith(opts.landingDirectory + "/" + fileName, opts.path + "/" + dataTypeName + "/" +idData + "/" + fileName, testCallback)).to.be.true;
        });

        it("should move the file to it final local destination", function() {
            var file = {name: fileAbsPath};
            strategy.storeFile(file, idData, dataTypeName, testCallback);
            expect(this.stub.calledOnce).to.be.true;
            var stubCall = this.stub.getCall(0);
            // TODO fix this test
            // expect(stubCall.calledWith(fileAbsPath, opts.path + "/" + dataTypeName + "/" +idData + "/" + fileName, testCallback)).to.be.true;
        });
    
    });

    describe("#downloadFileContent", function() {
        // TODO implement this!!
    });

});
