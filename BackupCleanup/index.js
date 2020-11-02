// needed cd ..; npm install azure-storage
// https://www.npmjs.com/package/azure-storage
// https://azure.github.io/azure-storage-node/global.html
// https://azure.github.io/azure-storage-node/BlobService.html#listBlobsSegmentedWithPrefix__anchor

let azure = require('azure-storage');

module.exports = function (context, myTimer) {
    
    let connectionString = process.env.AzureWebJobsStorage;
    let blobService = azure.createBlobService(connectionString);
    let toClean = [];
    let monthAgo = Date.now() - 24*60*60*1000 * 30;
    let prvsMonth = -1;
    
    getSegments(context, blobService, (context, entries, isMoreToCome, prvs) => {
        let got = prvs || new Date().toLocaleTimeString() + "\n";
        let count = 0;

        try {
        entries.forEach(e => {
            if (e.name.startsWith("20")) {
                let filedate = new Date(e.name.substring(0,10));
                if (filedate.getTime() < monthAgo && filedate.getMonth() == prvsMonth) {
                    toClean.push(e.name);
                } else {
                    prvsMonth = filedate.getMonth();
                }
                got += "\n" + e.name + "\t" + e.contentLength + "\t" + filedate ;
                count++;
            }
        });
        } catch (ex) {context.log(ex);}
        if (isMoreToCome) { got += "=== " + count + "\n"; }
        else {
            //context.log("" + got + "\n" + count + "\n");
            try {
            for (var i = 0; i< toClean.length; i++) {
                context.log(toClean[i]);
                blobService.deleteBlob("placesbackup", toClean[i], (e,r) => {});
            }
            } catch (ex) {context.log(ex);}
            context.log("to clean: " + toClean.length);

            context.done();
        }
    });

};


/// chomp(blobMetadataArray, isMoreToCome, previousChomped) -> chomped
function getSegments (context, blobService, chomp, token, passedOn) {
    blobService.listBlobsSegmentedWithPrefix("placesbackup","", token, null, 
        (error, result, response) => {
            // result.entries.{name, lastModified, contentLength, contentSettings.{contentType,contentEncoding}}
            // result.continuationToken
            let toPassForward = chomp(context, result.entries, !!result.continuationToken, passedOn);
            if (result.continuationToken) {
                getSegments(context, blobService, chomp, result.continuationToken, toPassForward);
            }
        });
}