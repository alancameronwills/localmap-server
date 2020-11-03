/** Called by a GitHub webhook when code in the map client is updated.
 * Copies the code to the blob "filestore."
 * 
 * Effect is that when you check the client code into GitHub master, 
 * it is automatically updated in the live version.
 * 
 * To use this, set up GitHub's webhook option in the client code repo.
 * Get the URL of this fn from Azure Functions control panel, as it includes a Function key.
 * Webhook monitor in GitHub shows recent calls and their success/failure.
 * 
 * This deals with additions and updates to the code. It doesn't deal with
 * deletions or renamings. After checking in such changes, 
 * use Azure Storage Explorer to the remove old files from the blob container.
 */

// Where to get the files from on Git. Note should be 'raw':
const gitPath = "https://raw.githubusercontent.com/alancameronwills/localmap/master/";

// Azure account key is taken from the environment variable AzureWebJobsStorage.
// In that account, this is the blob location:
const blobContainer = "deepmap";

// fetch is the fashionable way of making HTTP requests these days:
const fetch = require("node-fetch");
const azure = require('azure-storage');

/** Called by the GitHub HTML webhook */
module.exports = async function (context, req) {
    // Decipher the hook, which is a multipart HTTP request:
    // Split into the major and subparts; somewhere in there is "payload":
    let bitsa = decodeURI(req.body).split("&");
    let bits = {};
    for (var i = 0; i < bitsa.length; i++) {
        var kv = bitsa[i].split('=');
        var v = decode(kv[1]);
        bits[kv[0]] = v;
    }
    let payload = JSON.parse(bits.payload);
    // This doesn't deal with deletes. If you delete or rename an item, use 
    // Azure Storage Explorer to remove it.
    let commit = payload.head_commit;
    let fileNames = commit.modified.concat(commit.added);

    // File names are relative: e.g. index.html, img/m3.png

    for (var i = 0; i < fileNames.length; i++) {
        try {
            await transferToBlob(context, fileNames[i]);
        } catch (err) { context.log(err); }
    }

    /*
    Notice that we're moving the files one at a time into the live code.
    So for a checkin with many files:
    (a) there is a period during the updates when the code is inconsistent, 
    with some files updated and some not
    (b) there's a danger that a failure half way through could leave it inconsistent
    If doing it properly, we'd make a copy of the target blob container,
    update the contents of the copy, and then switch the names of the containers 
    to complete the transaction.
    Note that the try-catch doesn't protect against a failure half way through
    stopping the others. An exception in the child thread isn't caught by this, and 
    will leave the await waiting for ever. The process will eventually time out.
    */
};

function decode(s) {
    return s.replace(/%3A/g, ":").replace(/%2F/g, "/").replace(/%2C/g, ",").replace(/\+/g, " ").replace(/%20/g, " ");
}

/**
 * Copy a code file from Git to the blob 'filestore' 
 * @param {*} context - for logging
 * @param {*} name - relative file path, e.g. index.html or img/m3.png
 */
async function transferToBlob(context, name) {
    let filePath = gitPath + name;
    context.log(`Transfer ${name}`);
    var blobService = azure.createBlobService(process.env.AzureWebJobsStorage);
    // The Azure service functions take a callback, so we have a slightly convoluted way of
    // fulfilling the async promise:
    return promisify( resolver => {
        context.log(`fetch(${filePath})`);
        fetch(filePath)
            .then(response => {
                try {
                    let downloadType = response.headers.get("Content-Type");
                    let contentType = mime(name);
                    let contentLength = response.headers.get("Content-Length");
                    context.log(`Transfer ${name} type: ${contentType}  length: ${contentLength} download: ${downloadType}`);
                    if (contentType.startsWith("image")) {
                        blobService.createBlockBlobFromStream(blobContainer,
                            name,
                            response.body,  // is a readable stream
                            contentLength,
                            { contentSettings: { contentType: contentType } },
                            resolver);
                    } else {
                        context.log("text");
                        response.text().then(content => {
                            context.log(`Uploading ${content.substr(0, 40)}...`);
                            blobService.createBlockBlobFromText(blobContainer,
                                name,
                                content, // is a string
                                { contentSettings: { contentType: contentType } },
                                resolver);
                        });
                    }
                } catch (err) {
                    context.error(err);
                    resolver(err, null);
                }
            })
            .catch(err => {
                context.err(err);
                resolver(err, null);
            });
    });
}

/** Takes code that uses callbacks and turns it into a Promise.
 * @param {(error, result)=>void} codeTakingResolver
 */
function promisify(codeTakingResolver) {
    return new Promise((resolve, reject) => {
        codeTakingResolver((e, r) => { if (e) reject(e); else resolve(r); });
    });
}

async function createBlob(azureCreateFn, container, name, content, length, settings) {
    return new Promise((resolve, reject) => {
        azureCreateFn(container, name, content, length, settings,
            resolver(resolve, reject)
        );
    });
}

function mime(filename) {
    try {
        var ex = filename.match(/\.[^.]*$/)[0];
        if (ex == ".js") return "application/javascript";
        if (ex == ".html") return "text/html";
        if (ex == ".htm") return "text/html";
        if (ex == ".md") return "text/markdown";
        if (ex == ".js") return "application/javascript";
        if (ex == ".json") return "application/json";
        if (ex == ".css") return "text/css";
        if (ex == ".ico") return "image/x-icon";
        if (ex == ".css") return "text/css";
        if (ex == ".ico") return "image/x-icon";
        if (ex == ".png") return "image/png";
        if (ex == ".jpg") return "image/jpeg";
        if (ex == ".jpeg") return "image/jpeg";
    } catch (e) { }
    return "application/octet-stream";
}

