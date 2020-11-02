let request = require('request');

module.exports = function (context, myTimer, table, message) {
    const trunc = (s) => {
        var ss = s.replace(/<[^>]*>?/g," ");
        return (ss.length <60 ? ss : ss.substring(0,57) + "...");
    }

    var timeStamp = Date.now();

    //var outtable = table.filter(t => t.Text.indexOf("kiln") >= 0);
    var prefix = "https://deep-map.azurewebsites.net/?place=";
    var outtable = table.filter(t => t.LastModified > timeStamp - 2*86400000)
        .map(t => { return {u:t.User, t: trunc(t.Text), l: prefix + t.PartitionKey.replace(" ", "+") + "%7C" + t.RowKey};});
    // https://deep-map.azurewebsites.net/?place=Garn Fawr|2-5520060970700762
    context.log("length " + outtable.length);
    var result = "";
    if (outtable.length == 0) { result = "No contributions to the map in the past 24h.";}
    else {
        result = "<table>";
        for (var i = 0; i< outtable.length; i++) {
            result += "<tr><td>" + outtable[i].u + "</td><td><a href='" + outtable[i].l + "'>" + outtable[i].t + "</a></td></tr>";
        }
        result += "</table>";
    }

    // Check viewers
    let reqbody = '{"query" : "customEvents | where timestamp > ago(1d) | summarize by user_Id '
        + '| join kind= leftanti  '
        + '( customEvents | where timestamp < ago(1d) | summarize by user_Id '
        + ') on user_Id"}';
    let uri = "https://api.applicationinsights.io/v1/apps/{app-id}/query".
        replace(/{app-id}/, process.env["APPID"]);
    let options = {uri:uri,method:'POST',headers:{
            'Content-type': 'application/json;charset=utf-8',
            'Accept': 'application/json',
            'Accept-Charset': 'utf-8',
            'X-Api-Key' : process.env["APIKEY"]}, 
            body:reqbody};
    context.log(reqbody);
    request(options, function (error, response, resbody){
        if (!error) {
            context.log("c1");
            try {
                let b = JSON.parse(resbody);
                if (b.tables.length) {
                    result += "<p><b>" + b.tables[0].rows.length + "</b> viewers yesterday that weren't seen in past month</p>";
                }
            else result += error;
            } catch (eee) {context.log(eee);}
        } else context.log("Error " + error);
    
        result+="<p><a href='https://deep-map.azurewebsites.net/stats.html'>Views report</a></p>";
        context.log(result);
        // Send result    
        context.done(null, {message: {
            content: [{
                type: 'text/html',
                value: result
            }]
        }});
    });
}
