/** Make reduced-size copies of all current photos in a separate folder 
 * @param target=smedia : destination folder name
 * @param source=media : source folder name
 * @param size=600 : max height and width
 * @param quality=50
*/
const AzureStorageBlob = require("@azure/storage-blob");
const stream = require('stream');
const jimp = require('jimp');

const accountName = "deepmap";
const blobServiceClient = AzureStorageBlob.BlobServiceClient.fromConnectionString(process.env.AzureStorageConnectionString);
const containerClient = blobServiceClient.getContainerClient("deepmap");

module.exports = async function (context, req) {

    let targetFolder = (req.query.target || "smedia") + "/";
    let sourceFolder = (req.query.source || "media") + "/";
    let size = req.query.size || 600;
    let quality = req.query.quality || 50;

    let results = [];
    let prelim = "";
    let sourceBlobs = containerClient.listBlobsFlat({ prefix: sourceFolder });

    // Make a lookup dictionary of blobs already done
    let alreadyDoneBlobs = containerClient.listBlobsFlat({ prefix: targetFolder });
    let alreadyDone = {};
    for await (const done of alreadyDoneBlobs) {
        let shortName = shorten(done.name, targetFolder.length);
        alreadyDone[shortName] = 1;
    }

    try {
        for await (const blob of sourceBlobs) {
            try {
                let newSize = "";
                if (results.length < 50 && blob.properties.contentType.startsWith("image")) {
                    let shortName = shorten(blob.name, sourceFolder.length);
                    if (shortName && !alreadyDone[shortName]) {
                        let newName = targetFolder + shortName + ".jpg";
                        newSize = await processBlob(blob, newName, size, quality);
                        alreadyDone[shortName] = 2;
                        results.push(`<tr><td>${blob.name}</td> <td>${blob.properties.contentLength}</td><td>${newSize}</td> <td>${blob.properties.contentType}</td></tr>`);
                    }
                }
            } catch (err) {
                context.log(blob.name + "   " + err);
                prelim += "\n" + blob.name + "   " + err;
            }
        }
    } catch (err) {
        context.log(err);
    }

    prelim += `\nConverted ${results.length}`;
    context.log(prelim);

    // Do it again if there's probably more to do:
    let meta = results.length == 50 ? '<meta http-equiv="refresh" content="0">' : '';
    context.res = {
        // status: 200, /* Defaults to 200 
        body: `<html><head>${meta}<style>td:nth-child(2), td:nth-child(3){text-align:right;}</style></head><body><pre>${prelim}</pre><table>${results.join("\n")}</table></body></html>`,
        headers: { "Content-Type": "text/html;charset=utf-8" },
    };
};

function shorten(name, prefixLength) {
    return name.slice(prefixLength, name.lastIndexOf("."));
}

/** Get, resize, and write an image, always as jpeg.
 * @param blob {Blob} From content listing, to read
 * @param newName {string} New folder/name.jpg - must end in .jpg
 * @param size {int} Square in pixels to fit inside
 * @param quality {0..100} JPEG quality %
 * @see https://docs.microsoft.com/en-us/javascript/api/@azure/storage-blob/blockblobclient?view=azure-node-latest#uploadStream_Readable__number__number__BlockBlobUploadStreamOptions_
 */

async function processBlob(blob, newName, size, quality) {
    let jimage = await jimp.read("https://deep-map.azurewebsites.net/" + blob.name);
    let reducedImage = jimage.scaleToFit(size, size).quality(quality);
    let reducedBuffer = await reducedImage.getBufferAsync(jimp.MIME_JPEG);
    let readStream = stream.PassThrough();
    readStream.end(reducedBuffer); // i.e. write the lot and close the stream
    containerClient.getBlockBlobClient(newName).uploadStream(readStream, 8 * 1024 * 1024, 5, { blobHTTPHeaders: { blobContentType: "image/jpeg" } });
    //containerClient.uploadBlockBlob("s" + blob.name, readStream, readStream.readableLength, {});
    return readStream.readableLength;
}

function xinspect(o, i) {
    if (typeof i == 'undefined') i = '';
    if (i.length > 2) return '[MAX ITERATIONS]';
    var r = [];
    for (var p in o) {
        var t = typeof o[p];
        r.push(i + '"' + p + '" (' + t + ') => ' + (t == 'object' ? 'object:' + xinspect(o[p], i + '  ') : o[p] + ''));
    }
    return r.join(i + '\n');
}