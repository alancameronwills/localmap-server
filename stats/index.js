var request = require('request');
module.exports = async function (context, req) {
    let query = req.query.query || req.body.query;
    context.log(query);
    if (!query) {
        context.res = {status: 400}; 
        return;
    }
    let result = await getQuery(query, context);
    context.res = { 
        headers: {"Content-Type": "text/html"}, 
        body: result };
};

function getQuery(query, context) {
    let body = "{ \"query\" : \"" + query + "\" }";
    let appId = process.env["APPID"];
    let apiKey = process.env["APIKEY"];
    let path = "/v1/apps/{app-id}/query".replace(/{app-id}/, appId);
    let uri = "https://api.applicationinsights.io"+path;

    const options = {
        url: uri,
        method: 'POST',
        headers: {
            'Content-type': 'application/json;charset=utf-8',
            'Accept': 'application/json',
            'Accept-Charset': 'utf-8',
            'X-Api-Key' : apiKey,
        },
        body:body
    };

    return new Promise (function (resolve, reject) {
        request(options, function (error, response, body) {
            if (error) {
                reject ("(Failure)");
            }
            else {
                try {
                    resolve(body);
                } catch (err) {reject(err);}
            }    
        });
    })

}
