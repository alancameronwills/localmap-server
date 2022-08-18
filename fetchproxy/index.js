
    const fetch = require("node-fetch");  
    module.exports = async function (context, req) {
        await fetch (req.query.url)
        .then(data => {
            let h = data.headers;
            data.blob().then (blob =>
            {  
                context.log("1");
                context.res.isRaw = true;
                context.res.body = blob;
                context.res.headers.set("content-type","image/jpeg");
                context.res.send(blob);
            });
        })
        .catch (error => {context.res = {status:400}; context.log("X "+error);})
    };
    