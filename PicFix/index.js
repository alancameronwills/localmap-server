// needed cd ..; npm install azure-storage
// https://www.npmjs.com/package/azure-storage
// https://azure.github.io/azure-storage-node/global.html
// https://azure.github.io/azure-storage-node/BlobService.html#listBlobsSegmentedWithPrefix__anchor

let azure = require('azure-storage');
//let jimp = require('jimp');
module.exports = function (context, req) {
    let connectionString = process.env.AzureWebJobsStorage;
    let blobService = azure.createBlobService(connectionString);
    getSegments(context, blobService, (context, entries, isMoreToCome, prvs) => {
        let got = prvs || new Date().toLocaleTimeString() + "\n";
        let count = 0;
        try {
        entries.forEach(e => {
            if (e.contentSettings.contentType.startsWith("image")) {
                got += "\n" + e.name + "\t" + e.contentLength + "\t" + e.contentSettings.contentType ;
                count++;
            }
        });
        if (isMoreToCome) { got += "=== " + count + "\n"; }
        if (!isMoreToCome) {
            context.res.body = got + "\n" + count + "\n";
            context.done();
        }
        return got;
        } catch (ex) {context.log(ex);}
    });
}

/// chomp(blobMetadataArray, isMoreToCome, previousChomped) -> chomped
function getSegments (context, blobService, chomp, token, passedOn) {
    blobService.listBlobsSegmentedWithPrefix("deepmap","media/", token, null, 
        (error, result, response) => {
            // result.entries.{name, lastModified, contentLength, contentSettings.{contentType,contentEncoding}}
            // result.continuationToken
            let toPassForward = chomp(context, result.entries, !!result.continuationToken, passedOn);
            if (result.continuationToken) {
                getSegments(context, blobService, chomp, result.continuationToken, toPassForward);
            }
        });
}
