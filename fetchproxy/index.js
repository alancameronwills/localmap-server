
    const fetch = require("node-fetch");  
    module.exports = async function (context, req) {
            try {
                let data = await fetch(req.query.url);
                let h = data.headers;
                context.log("0 " + JSON.stringify(Array.from(h.entries())));
                context.log(`0a ${data.url} ${data.type}`);
                let blob = await data.arrayBuffer();
                context.log(`1 ${blob.byteLength}`);
                context.res= { 
                    headers: {"Content-Type" : h.get("content-type")},
                    status: "200",
                    isRaw: true,
                    body: new Uint8Array(blob)
                };

            } catch (error) {
                context.log("X1 " + error); context.res = { status: 400, body: "" };
            }
    };
    