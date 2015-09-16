/**
 * @author Massimiliano Izzo
 */
var http = require('http');
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
 * @description API to manage data through iRODS Rest API
 */
function IrodsRestStrategy(conf) {
    // console.log(irodsConf);
    if (!conf) {
        // console.log("missing irodsConf");
        // throw some error
        return;
    }
    this.irodsHome = conf.irodsHome;
    this.landingCollection = conf.landingCollection;
    this.repoCollection = conf.repoCollection;
    this.restURL = conf.restURL;
    this.username = conf.username;
    this.password = conf.password; 
    _.bindAll(this);
}

IrodsRestStrategy.prototype = {

    editDataFile: function(xtensDataFile, idData, dataTypeName, next) {
        console.log('IrodsRestStrategy.editDataFile: res.onEnd');
        xtensDataFile.uri = this.irodsHome + "/" + this.repoCollection + "/" + dataTypeName + "/" + 
            (idData ? idData + "/" : "") + xtensDataFile.name; 
        delete xtensDataFile.name;
        console.log("IrodsRestStrategy.editDataFile: uri = " + xtensDataFile.uri);
        console.log("IrodsRestStrategy.editDataFile: success...calling callback");
        next();
    },
    
    /**
     * @description execute a POST /rule call to irods-rest API and move the DataObject (i.e.file)
     *              from the landingCollection to repoCollection/dataTypeName[/idData] (if idData is available) 
     */
    storeFile: function(xtensDataFile, idData, dataTypeName, callback) {
        
        // if there is already the file URI move on, the file is already stored at its definitive location
        if (xtensDataFile.uri) {
            callback();
            return;
        }

        var irodsRuleInputParameters = [
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

        var postOptions = {
            hostname: this.restURL.hostname,
            port: this.restURL.port,
            path: this.restURL.path + '/rule',
            method: 'POST', 
            auth: this.username + ':' + this.password,
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            } 
        };
        console.log(postOptions);
        
        var _this = this;
        var postRequest = http.request(postOptions, function(res) {
            res.setEncoding('utf8');
            var resBody = '';

            res.on('data', function(chunk) {
                resBody += chunk;
            });

            res.on('end', function() {
                console.log(_this);
                _this.editDataFile(xtensDataFile, idData, dataTypeName, callback);
            });
        });

        postRequest.on('error',function(err) {
            console.log('irods.moveFile - problem with request: ' + err.message);
            callback(err);
        });

        var body = {
            ruleProcessingType: "INTERNAL",
            ruleAsOriginalText: storeFileRule,
            irodsRuleInputParameters: irodsRuleInputParameters
        };

        postRequest.write(JSON.stringify(body));
        postRequest.end();

    },

    /**
     * @method
     * @name downloadFileContent
     * @description download a file from the iRODS file system through the irods-rest API
     * @param{string} uri - the URI of the file on iRODS ("virtual path")
     */
    downloadFileContent: function(uri, remoteRes, callback) {

        var getOptions = {
            hostname: this.restURL.hostname,
            port: this.restURL.port,
            path: this.restURL.path + '/fileContents' + uri,
            method: 'POST', 
            auth: this.username + ':' + this.password,
        };
        
        
        var getRequest = http.request(getOptions, function(res) {
            
            res.pipe(remoteRes);    
            
            res.on('end', function() {
                console.log("irods.downloadFileContent - file download ended");
                callback();
            });
        });

        getRequest.on('error', function(err) {
            console.log('irods.downloadFileContent - problem while downloading file: ' + err.message);
            callback(err);
        });

        getRequest.end();
        
    }

};
module.exports = IrodsRestStrategy;
