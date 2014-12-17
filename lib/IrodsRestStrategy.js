/**
 * @author Massimiliano Izzo
 */
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
    console.log(irodsConf);
    if (!irodsConf) {
        console.log("missing irodsConf");
        // throw some error
        return;
    }
    this.irodsHome = irodsConf.irodsHome;
    this.landingCollection = irodsConf.landingCollection;
    this.repoCollection = irodsConf.repoCollection;
    this.irodsRest = irodsConf.irodsRest;
    this.username = irodsConf.username;
    this.password = irodsConf.password;
    console.log(this.irodsHome);
}

IrodsRestStrategy.prototype = {

    storeFile: function(xtensDataFile, idData, dataTypeName, callback) {
        console.log(this.irodsHome);
         
        var file = xtensDataFile;
        var irodsRuleInputParameters = [
            {name: "*irodsHome", value: this.irodsHome},
            {name: "*dataTypeName", value: dataTypeName},
            {name: "*fileName", value: file.name},
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

        var postRequest = http.request(postOptions,function(res) {
            res.setEncoding('utf8');

            var resBody = '';

            res.on('data', function(chunk) {
                resBody += chunk;
            });

            res.on('end', function() {
                console.log('res.end');
                console.log(resBody); 
                file.uri = this.irodsHome + "/" + this.repoColl + "/" + dataTypeName + "/" + 
                    (idData ? idData + "/" : "") + file.name; 
                delete file.name;
                console.log("irods.moveFile: uri = " + file.uri);
                console.log("irods.moveFile: success...calling callback");
                callback();
            });
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
