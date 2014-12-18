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
function IrodsRestStrategy(irodsConf) {
    // console.log(irodsConf);
    if (!irodsConf) {
        // console.log("missing irodsConf");
        // throw some error
        return;
    }
    this.irodsHome = irodsConf.irodsHome;
    this.landingCollection = irodsConf.landingCollection;
    this.repoCollection = irodsConf.repoCollection;
    this.irodsRest = irodsConf.irodsRest;
    this.username = irodsConf.username;
    this.password = irodsConf.password; 
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

    storeFile: function(xtensDataFile, idData, dataTypeName, callback) {

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
            hostname: this.irodsRest.hostname,
            port: this.irodsRest.port,
            path: this.irodsRest.path + '/rule',
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

            /*
               res.on('end', function() {
               this.editDataFileUri(xtensDataFile, callback);
               console.log('res.end');
               console.log(resBody); 
               file.uri = this.irodsHome + "/" + this.repoCollection + "/" + dataTypeName + "/" + 
               (idData ? idData + "/" : "") + file.name; 
               delete file.name;
               console.log("irods.moveFile: uri = " + file.uri);
               console.log("irods.moveFile: success...calling callback");
               callback(); 
               }.bind(this)); */
        });

        postRequest.on('error',function(err) {
            console.log('irods.moveFile: problem with request: ' + err.message);
            callback(err);
        });

        var body = {
            ruleProcessingType: "INTERNAL",
            ruleAsOriginalText: storeFileRule,
            irodsRuleInputParameters: irodsRuleInputParameters
        };

        postRequest.write(JSON.stringify(body));
        postRequest.end();

    }

};
module.exports = IrodsRestStrategy;
