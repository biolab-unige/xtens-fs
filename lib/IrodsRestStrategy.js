/**
 * @module IrodsRestStrategy
 * @author Massimiliano Izzo
 */
/*jshint node: true */
/*jshint esnext: true */
"use strict";

var url = require("url");
var request = require('request');
var _ = require('lodash');

var storeFileRule = [
    'xtensFileMove {',
    '*destColl = str(*irodsHome)++"/"++str(*repoColl)++"/"++str(*dataTypeName);',
    'writeLine("serverLog", "idData is *idData");',
    'if (int(*idData) > 0) then {',
    '*destColl = *destColl ++ "/" ++ str(*idData);',
    '}',
    'writeLine("serverLog", "destColl is *destColl");',
    'msiCollCreate(str(*destColl), "1", *status) ::: msiRollback;',
    '*source = str(*irodsHome)++"/"++str(*landingColl)++"/"++str(*fileName);',
    'writeLine("serverLog", "source is *source");',
    '*destination = str(*destColl)++"/"++str(*fileName);',
    'writeLine("serverLog", "destination is *destination");',
    'msiDataObjRename(*source, *destination, "0", *status);',
    '}',
    'INPUT *irodsHome = "/biolabZone/home/superbiorods", *landingColl="land", *fileName = "void.txt", *dataTypeName = "none", *repoColl="test-repo", *idData =0',
    'OUTPUT *ruleExecOut'
].join('\r\n');

    /**
     * @class
     * @name IrodsRestStrategy
     * @description API to manage data through iRODS Rest API
     */
class IrodsRestStrategy {

    /**
     * @constructor
     * @param{Object} conf - configuration object
     */
    constructor(conf) {

        if (!conf) {
            //TODO throw some error
            return;
        }
        this.irodsHome = conf.irodsHome;
        this.landingCollection = conf.landingCollection;
        this.repoCollection = conf.repoCollection;
        this.restURL = conf.restURL;
        this.username = conf.username;
        this.password = conf.password;

        /**
         * @private
         * @method
         * @name _editDataFile
         */
        this._editDataFile = function(xtensDataFile, idData, dataTypeName, next) {
            console.log('IrodsRestStrategy.editDataFile: res.onEnd');
            xtensDataFile.uri = this.irodsHome + "/" + this.repoCollection + "/" + dataTypeName + "/" + 
                (idData ? idData + "/" : "") + xtensDataFile.name; 
            delete xtensDataFile.name;
            console.log("IrodsRestStrategy.editDataFile: uri = " + xtensDataFile.uri);
            console.log("IrodsRestStrategy.editDataFile: success...calling next function");
            next();
        };

        _.bindAll(this);

    }

    /**
     * @method
     * @name storeFile
     * @param{Object} xtensDataFile
     * @param{integer} idData - the ID of the Data in XTENS
     * @param{string} dataTypeName - the (unique) DataType name
     * @param{function} callback - the callback function
     * @description execute a POST /rule call to irods-rest API and move the DataObject (i.e.file)
     *              from the landingCollection to repoCollection/dataTypeName[/idData] (if idData is available) 
     */
    storeFile(xtensDataFile, idData, dataTypeName, callback) {
        
        // if there is already the file URI move on, the file is already stored at its definitive location
        if (xtensDataFile.uri) {
            callback();
        }

        let irodsRuleInputParameters = [
            {name: "*irodsHome", value: this.irodsHome},
            {name: "*dataTypeName", value: dataTypeName},
            {name: "*fileName", value: xtensDataFile.name},
            {name: "*landingColl", value: this.landingCollection},
            {name: "*repoColl", value: this.repoCollection}
        ];

        if (idData) {
            console.log("adding idData...");
            irodsRuleInputParameters.push({name: "*idData", value: idData});
        }

        let reqBody = {
            ruleProcessingType: "INTERNAL",
            ruleAsOriginalText: storeFileRule,
            irodsRuleInputParameters: irodsRuleInputParameters
        };
        
        let postOptions = {
            uri: _.assign(this.restURL, {path: this.restURL.path + '/rule'}),
            /*
            uri : url.format({
                protocol: this.restURL.protocol,
                hostname: this.restURL.hostname,
                port: this.restURL.port,
                path: this.restURL.path + '/rule'
            }), */
            method: 'POST', 
            auth: {
                username: this.username,
                password: this.password
            },
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            json: reqBody
        };

        let that = this;

        // request internal callback function
        function cb(error, response, body) {
            if (error) {
                console.log('IrodsRestStrategy.moveFile - problem with request: ' + error.message);
                callback(error);
            }
            that._editDataFile(xtensDataFile, idData, dataTypeName, callback);
        }
        
        // execute POST request to iRODS
        request(postOptions, cb);
        
    }

    /**
     * @method
     * @name downloadFileContent
     * @description download a file from the iRODS file system through the irods-rest API
     * @param{string} uri - the URI of the file on iRODS ("virtual path")
     * @param{response} remoteRes - the "remote" Node.js response object
     * @param{function} callback - the callback function
     */
    downloadFileContent(uri, remoteRes, callback) {
        
        let getOptions = {
            uri: _.assign(this.restURL, {path: this.restURL.path + '/fileContents' + uri}),
            /*
            uri: url.format({
                hostname: this.restURL.hostname,
                port: this.restURL.port,
                path: this.restURL.path + '/fileContents' + uri
            }), */
            method: 'GET', 
            auth: {
                username: this.username,
                password: this.password
            }
        };
        
        request(getOptions).pipe(remoteRes)
        .on('error', function(err) {
            console.log('IrodsRestStrategy.downloadFileContent - problem while downloading file: ' + err.message);
            callback(err);
        })
        .on('end', function() {
            console.log("IrodsRestStrategy.downloadFileContent - file download successfully ended!");
            callback();
        });

    }

}

module.exports = IrodsRestStrategy;
