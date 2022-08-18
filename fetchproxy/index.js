
    const fetch = require("node-fetch");  
    module.exports = async function (context, req) {
        await fetch (req.query.url)
        .then((data) => {context.log("0"); return data.text();})
        .then (data =>
            {  
                context.log("1");
             parseString(data, (err, result) => {
                context.log("2");
                 context.res = {
                    //status: 200, /* Defaults to 200 */
                    body: data
                };
             });
            }
        )
        .catch (error => {context.res = {status:400}; context.log("X "+error);})
    };
    