
var request = require('request');

module.exports = async function (context, req) {  
    let days = req.query.days || "3";
    if (!days.match(/^[1-9]$|^[1-3][0-9]$/)) days = "3";
    let result = await getUsers(context, days);
    context.res = {headers:{"Content-Type": "text/html"}, 
        body: "<!DOCTYPE html><html>"
        + "<head><style>body{font-family:sans-serif} tr:nth-child(even){background-color:#e0e0e0}</style></head>"
        + "<body><h1>Map accesses by place in the past {days} days</h2>".replace("{days}", days)
         + result + "</body></html>"};
    context.done();
};

function tabulate (body, context) {
    let columns = body.tables[0].columns;
    let rows = body.tables[0].rows;
    let result = "<table><tr>";
    for (var ih=0; ih<columns.length; ih++) {
        result += "<th>" + columns[ih].name + "</th>"
    }
    result += "</tr>\n";
    for (var i = 0; i<rows.length; i++) {
        result += "<tr>";
        let row = rows[i];
        for (var j = 0; j<row.length; j++) {
            result += "<td>" + (row[j] || "") + "</td>"
        }
        result += "</tr>\n";
    }
    result += "</table>";
    return result;
}

function getUsers(context, days) {
    let query = ("customEvents | where name == 'popPetals' and timestamp > ago({days}d)"
        + " | summarize pops=count(), popUsers=dcount(user_Id)  by placePop=tostring(customDimensions.place)"
        + " | join kind=fullouter ("
        + " customEvents | where name == 'presentSlidesOrEdit' and timestamp > ago({days}d)"
        + " | summarize opens=count(), openUsers=dcount(user_Id)  by placePresent=tostring(customDimensions.place)"
        + " ) on $left.placePop==$right.placePresent"
        + " | project place = iff(placePop != '', placePop , placePresent ), pops, popUsers , opens, openUsers "
        + " | sort by opens, pops").replace(/{days}/g, days);
        
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
                    resolve(tabulate(JSON.parse(body), context));
                } catch (err) {reject(err);}
            }    
        });
    })

}
