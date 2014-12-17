/**
 * @author Massimiliano Izzo
 * @description this builder works as a context for the query/search strategy
 */
var IrodsRestStrategy = require('./IrodsRestStrategy.js');

function FileSystemManager(strategy, options) {
    if (!strategy) {
        strategy = new IrodsRestStrategy(options);
    }
    this.setStrategy(strategy);
}

FileSystemManager.prototype = {
    
    setStrategy: function(strategy) {
        this.strategy = strategy;
    },

    storeFile: function() {
        this.strategy.storeFile.apply(this.fileSystem, arguments);
    }

};

module.exports = FileSystemManager;
