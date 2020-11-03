let request = require('request');    // xxxxxxx
let fetch = require("node-fetch");
let azure = require('azure-storage');

module.exports = async function (context, req) {

    // Decipher the hook
    let bitsa = decodeURI(req.body).split("&");
    let bits = {};
    for (var i = 0; i < bitsa.length; i++) {
        var kv = bitsa[i].split('=');
        var v = decode(kv[1]);
        bits[kv[0]] = v;
    }
    let payload = JSON.parse(bits.payload);
    let commit = payload.head_commit;
    let files = commit.modified.concat(commit.added);

    //context.log(files);
    for (var i = 0; i < files.length; i++) {
        // Get the updated file
        try {
            await transferToBlob(context, files[i]);
            /*
            let content = await getFile(files[i]);
            // Upload to store
            await sendToBlob(files[i], content, context);
            */
        } catch (err) { context.log(err); }
    }


};

async function transferToBlob(context, fileName) {
    context.log(`Transfer ${fileName}`);
    var blobService = azure.createBlobService(process.env.AzureWebJobsStorage);
    return new Promise((resolve, reject) => {
        fetch(fileName)
            .then(response => {
                try {
                    let contentType = response.headers.get("Content-Type");
                    let contentLength = response.headers.get("Content-Length");
                    context.log(`Transfer ${fileName} type: ${contentType}  length: ${contentLength}`);
                    if (contentType.startsWith("image")) {
                        blobService.createBlockBlobFromStream("deepmap", name, response.body,
                            contentLength,
                            { contentSettings: { contentType: contentType } },
                            (e, r) => {
                                if (e) { context.error(e); reject(e); }
                                else { context.log("done"); resolve(r); }
                            });
                    } else {
                        response.text().then(content => {
                            blobService.createBlockBlobFromText("deepmap", name, content,
                                { contentSettings: { contentType: contentType } },
                                (e, r) => {
                                    if (e) { context.error(e); reject(e); }
                                    else { context.log("done"); resolve(r); }
                                });
                        })
                    }
                } catch (err) {
                    context.error(err);
                }
            });
    });
}

async function sendToBlob(name, content, context) {
    context.log("sendToBlob " + name + "  " + content.length);
    let connectionString = process.env.AzureWebJobsStorage;
    var blobService = azure.createBlobService(connectionString);
    return new Promise((resolve, reject) => {
        let contentType = mime(name);
        if (contentType.startsWith("image")) {
            blobService.createBlockBlobFromStream("deepmap", name, content,
                { contentSettings: { contentType: contentType } },
                (e, r) => {
                    if (e) { context.error(e); reject(e); }
                    else { context.log("done"); resolve(r); }
                });
        } else {
            blobService.createBlockBlobFromText("deepmap", name, content,
                { contentSettings: { contentType: contentType } },
                (e, r) => {
                    if (e) { context.error(e); reject(e); }
                    else { context.log("done"); resolve(r); }
                });
        }
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

async function getFile(filename) {
    var rawFN = "https://raw.githubusercontent.com/alancameronwills/localmap/master/" + filename;
    return new Promise(function (resolve, reject) {
        request(rawFN, function (error, response, body) {
            if (error) {
                reject(error);
            }
            else {
                resolve(body);
            }
        });
    });
}

function trim(s) {
    if (!s) return "";
    return s.trim('"');
}

function decode(s) {
    return s.replace(/%3A/g, ":").replace(/%2F/g, "/").replace(/%2C/g, ",").replace(/\+/g, " ").replace(/%20/g, " ");
}