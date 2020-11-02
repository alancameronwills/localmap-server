module.exports = async function (context, req) {
    const fetch = require("node-fetch");   
    const parseString = require('xml2js').parseString; 
    const STORAGE_ACCOUNT_STRING = process.env.AzureWebJobsStorage;
    await fetch ("https://deepmap.blob.core.windows.net/deepmap?restype=container&comp=list&prefix=places") .
    then((data) => data.text().then (data =>
        //if (req.query.name || (req.body && req.body.name)) {
        {   // context.log("fetch then");
         parseString(data, (err, result) => {
             context.res = {
            // status: 200, /* Defaults to 200 */
                body: JSON.stringify(result, replacer)
            };
         })
        ;})
    )
};
function replacer (k,v) {
    if (!(k.match(/^[0-9]+$/)) && 
        "$ EnumerationResults ContainerName Blobs Blob Name Properties Last-Modified Content-Length"
        .indexOf(k) < 0) {return undefined;}
    if (v.length == 1) return v[0];
    return v;
}
