
    const fetch = require("node-fetch");  
    module.exports = async function (context, req) {
        await fetch (req.query.url)
        .then (data =>
            {  
                context.log("1");
                context.res = {
                    body: data.body
                };
            }
        )
        .catch (error => {context.res = {status:400}; context.log("X "+error);})
    };
    