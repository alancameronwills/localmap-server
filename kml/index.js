let azure = require('azure-storage');

module.exports = async function (context, req, table) {
    let project = req.query && req.query.project || "";
    //context.log("1");
    let connectionString = process.env.AzureWebJobsStorage;
    let tableService = azure.createTableService(connectionString);
    let query = new azure.TableQuery();
    if (project) query = query.where("PartitionKey == ?", project);
    //context.log("2");
    let result = await tableQuery(context, tableService, query);
    context.res = {
        headers: { "Content-Type": "application/vnd.google-earth.kml+xml;charset=utf-8" },
        body: result
    };
}

function tableQuery(context, tableService, query) {
    return new Promise(function (resolve, reject) {
        //context.log("3");
        tableService.queryEntities("places", query, null, function (error, result, response) {
            if (!error) {
                //context.log("4");
                let xml = '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2">\n';
                for (var i = 0; i < result.entries.length; i++) {
                    let row = result.entries[i];
                    if (row.Deleted && row.Deleted._) continue;                    
                    let id = row.PartitionKey._.replace(" ", "+") + "%7C" + row.RowKey._;
                    let title = row.Text._.replace(/(<div|<p|<br).*/s, "").replace(/<[^>]*>/g, "");
                    xml += `<Placemark><name>${title}</name><description><![CDATA[${row.Text._}]]></description>`
                        + `<Point><coordinates>${row.Longitude._},{row.Latitude._}</coordinates></Point>`
                        + `<User>${row.User._}</User>`
                        + `<Group>${row.Group._}</Group>`
                        + (row.Media._.length>2 ? `<Media>${row.Media._}` : "")
                        + (row.Tags ? `<Tags>${row.Tags._}</Tags>`:"")
                        + (row.Next ? `<Next>${row.Next._}</Next>`:"")
                        + `</Placemark>\n`;
                }
                xml += "</kml>";
                resolve(xml);
            } else {
                //context.log("7");
                reject(error);
            }
        })
    });
}
