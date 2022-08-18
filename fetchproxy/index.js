
    const fetch = require("node-fetch");  
    module.exports = async function (context, req) {
        await fetch (req.query.url)
        .then((data) => data.text().then (data =>
            {  
             parseString(data, (err, result) => {
                 context.res = {
                    //status: 200, /* Defaults to 200 */
                    body: data
                };
             });
            })
        )
        .catch (error => context.res = {status:400})
    };
    