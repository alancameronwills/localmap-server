// Sendmail details in console installed modules

const sg = require('sendgrid')(process.env.SendGridApiKey1);
const request = require('request');

module.exports = async function (context, myTimer, table) {

    //send(context, ["alancameronwills@gmail.com"], "Test <span style='color:green'>stuff</span>");

    summarize(context, table, "", ["span@pantywylan.org"], true);
    summarize(context, table, "Folio", ["alan@pantywylan.org", "chair@foliosuttoncoldfield.org.uk"], false);

};

function summarize(context, table, project, recipients, doViewers) {
    var timeStamp = Date.now();
    //context.log("1 " + table.length);
    //var outtable = table.filter(t => t.Text.indexOf("kiln") >= 0);
    var prefix = "https://deep-map.azurewebsites.net/?place=";
    var outtable = table.filter(t => t.LastModified > timeStamp - 7 * 86400000 && (!project || project == t.PartitionKey))
        .map(t => { return { u: t.User, t: trunc(t.Text), l: prefix + t.PartitionKey.replace(" ", "+") + "%7C" + t.RowKey }; });
    // https://deep-map.azurewebsites.net/?place=Garn Fawr|2-5520060970700762
    //context.log("length " + outtable.length);
    var result = "<h1>" + project + " Deep map</h1><p>New and updated places in the past week</p>";
    if (outtable.length == 0) { result += "No contributions to the map in the past week."; }
    else {
        result += "<table>";
        for (var i = 0; i < outtable.length; i++) {
            if (outtable[i].t) {
                result += "<tr><td>" + outtable[i].u + "</td><td><a href='" + outtable[i].l + "'>" + outtable[i].t + "</a></td></tr>";
            }
        }
        result += "</table>";
    }

    if (doViewers) {

        // Check viewers
        let reqbody = '{"query" : "customEvents | where timestamp > ago(7d) | summarize by user_Id '
            + '| join kind= leftanti  '
            + '( customEvents | where timestamp < ago(7d) | summarize by user_Id '
            + ') on user_Id"}';
        let uri = "https://api.applicationinsights.io/v1/apps/{app-id}/query".
            replace(/{app-id}/, process.env["APPID"]);
        let options = {
            uri: uri, method: 'POST', headers: {
                'Content-type': 'application/json;charset=utf-8',
                'Accept': 'application/json',
                'Accept-Charset': 'utf-8',
                'X-Api-Key': process.env["APIKEY"]
            },
            body: reqbody
        };

        request(options, function (error, response, resbody) {
            if (!error) {
                //context.log("c1");
                try {
                    let b = JSON.parse(resbody);
                    if (b.tables.length) {
                        result += "<p><b>" + b.tables[0].rows.length + "</b> viewers in the past week that weren't seen in past month</p>";
                    }
                    else result += error;
                } catch (eee) { context.log(eee); }
            } else context.log("Error " + error);

            result += "<p><a href='https://deep-map.azurewebsites.net/stats.html'>Views report</a></p>";

            send(context, recipients, result);
        });
    } else {
        result += "<p><a href='https://deep-map.azurewebsites.net/stats.html'>Views report</a></p>";
        send(context, recipients, result);
    }
}

function trunc(s) {
    var ss = s.replace(/<[^>]*>?/g, " ");
    return (ss.length < 60 ? ss : ss.substring(0, 57) + "...");
}

function send(context, recipients, message) {
    let request = sg.emptyRequest({
        method: "POST",
        path: "/v3/mail/send",
        body: {
            personalizations: [
                {
                    to: recipients.map(x => { return { email: x } }),
                    subject: "Deep Map recent contributions"
                }
            ],
            from: {
                email: "info@pantywylan.org"
            },
            content: [
                {
                    type: "text/html",
                    value: message
                }
            ]
        }
    });
    /*
    context.log("3");
    sg.API(request, (a, b, c) => {
        context.log("4");
        context.log("[" + a + "|" + b + "|" + c);
    });
    */
}

