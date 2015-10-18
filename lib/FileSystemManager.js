/**
 * @author Massimiliano Izzo
 * @description this builder works as a context for the query/search strategy
 */
var LocalFileSystemStrategy = require('./LocalFileSystemStrategy.js');
var IrodsRestStrategy = require('./IrodsRestStrategy.js');

function FileSystemManager(fileSystemConf) {
    var strategy;

    switch(fileSystemConf.type) {
        
        case 'irods-rest':
            strategy = new IrodsRestStrategy(fileSystemConf);
            break;
        case 'local-fs':
            strategy = new LocalFileSystemStrategy(fileSystemConf);
            break;
        default:
            strategy = null;

    }
    this.setStrategy(strategy);
}

FileSystemManager.prototype = {
    
    setStrategy: function(strategy) {
        this.strategy = strategy;
    },

    storeFile: function() {
        this.strategy.storeFile.apply(this.strategy, arguments);
    },

    downloadFileContent: function() {
        this.strategy.downloadFileContent.apply(this.strategy, arguments);
    }

};

module.exports = FileSystemManager;
