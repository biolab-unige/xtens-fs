/**
 * @author Massimiliano Izzo
 * @description this builder works as a context for the query/search strategy
 */
var IrodsRestStrategy = require('./IrodsRestStrategy.js');

function FileSystemManager(fileSystemConf) {
    var strategy;

    switch(fileSystemConf.type) {
        
        case 'irodsRest':
            strategy = new IrodsRestStrategy(fileSystemConf);
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
    }

};

module.exports = FileSystemManager;
