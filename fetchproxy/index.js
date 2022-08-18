
    const fetch = require("node-fetch");  
    module.exports = async function (context, req) {
        await fetch (req.query.url)
        .then(data => data.blob()
        .then (blob =>
            {  
                context.log("1");
                context.res = {
                    body: blob,
                    headers: data.headers
                };
            }
        ))
        .catch (error => {context.res = {status:400}; context.log("X "+error);})
    };
    