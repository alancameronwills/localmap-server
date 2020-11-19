// needed cd ..; npm install azure-storage
// https://www.npmjs.com/package/azure-storage
// https://azure.github.io/azure-storage-node/global.html
// https://azure.github.io/azure-storage-node/BlobService.html#listBlobsSegmentedWithPrefix__anchor

let azure = require('azure-storage');
let fs = require("fs");
let jimp = require('jimp');
module.exports = async function (context, req) {
    let connectionString = process.env.AzureWebJobsStorage;
    let blobService = azure.createBlobService(connectionString);
    getSegments(context, blobService, (context, entries, isMoreToCome, prvs) => {
        let got = prvs || new Date().toLocaleTimeString() + "\n";
        let count = 0;
        try {
            /*
        entries.forEach(e => {
            if (e.contentSettings.contentType.startsWith("image")) {
                got += "\n" + e.name + "\t" + e.contentLength + "\t" + e.contentSettings.contentType ;
                count++;
                await processBlob(container, e.name);
            }
        }); */
        for(let i = 0; i<entries.length; i++) {
            if (e.contentSettings.contentType.startsWith("image")) {
                got += "\n" + e.name + "\t" + e.contentLength + "\t" + e.contentSettings.contentType ;
                count++;
                await processBlob(container, e.name);
            }
            if (i > 3) break;
        }
        if (isMoreToCome) { got += "=== " + count + "\n"; }
        if (!isMoreToCome) {
            context.res.body = got + "\n" + count + "\n";
            //context.done();
        }
        return got;
        } catch (ex) {context.log(ex);}
    });
}

async function processBlob (container, blobName) {
    await jimp.read("https://deep-map.azurewebsites.net/media/" + blobName)
        .then(image => image.scaleToFit(800,800).getBufferAsync(Jimp.AUTO)
        //.then(buffer => blobService.createBlockBlobFromStream(container, "s_media/"+blobName, stream, buffer.length)))
        .then (buffer => {
            let writeStream = blobService.createWriteStreamToBlockBlob(container, "s_media/" + blobName);
            fs.createReadStream(buffer).pipe(writeStream);
        }));
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
