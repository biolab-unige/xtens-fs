/**
 * @author Massimiliano Izzo
 */
/*jshint node: true */
/*jshint esnext: true */

"use strict";

var BluebirdPromise = require("bluebird");
var fs = BluebirdPromise.promisifyAll(require("fs"));
var fse = BluebirdPromise.promisifyAll(require("fs-extra"));
var path = require("path");

/**
 * @class 
 * @name FileSystemLocalStrategy
 * @description class to manage files operations on the local (i.e. server) file system
 */
class LocalFileSystemStrategy {

    /**
     * @constructor
     * @param{Object} conf - configuration object
     */
    constructor(conf) {
        if (!conf) {
            return;
        }
        this.path = conf.path;
        this.landingDirectory = conf.landingDirectory;
        this.repoDirectory = conf.repoDirectory;

        /**
         * @private
         * @method
         * @name _editDataFile
         */
        this._editDataFile = function(xtensDataFile, destination, next) {
            xtensDataFile.uri = destination;
            delete xtensDataFile.name;
            next();
        };


    }

    
    /**
     * @method
     * @name storeFile
     */
    storeFile(xtensDataFile, idData, dataTypeName, callback) {
        var _this = this;
        var fileName = xtensDataFile.name.split("/")[xtensDataFile.name.split("/").length - 1];
        var source = path.isAbsolute(xtensDataFile.name) ? xtensDataFile.name : this.path + "/" + this.landingDirectory + "/" + xtensDataFile.name;
        var destination = this.path + "/" + this.repoDirectory + "/" + dataTypeName + "/" + idData + "/" + fileName;
        fse.moveAsync(source, destination)
        .then(function() {
            console.log("LocalFileSystemStrategy.storeFile - done. Calling _editDataFile...");
            _this._editDataFile(xtensDataFile, destination, callback);
        })
        .catch(function(err) {
            console.log(err);
            throw new Error("LocalFileSystemStrategy.storeFile - file was not registered correctly in the file system");
        });
        //   
    }

    /**
     * @method
     * @name downloadFileContent
     */
    downloadFileContent(uri, remoteRes, callback) {
       // TODO: test this!! 
        var fileStream = fs.createReadStream(uri);
        fileStream.pipe(remoteRes);
        
        fileStream.on('end', function() {
            console.log("LocalFileSystemStrategy.downloadFileContent - file download ended");
            callback();
        });

        fileStream.on('error', function(err) {
            console.log('LocalFileSystemStrategy.downloadFileContent - problem while downloading file: ' + err.message);
            callback(err);
        });


    }




}

module.exports = LocalFileSystemStrategy;
