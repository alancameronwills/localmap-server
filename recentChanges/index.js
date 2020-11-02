let azure = require('azure-storage');

module.exports = async function (context, req, table) {
    let days = req.query && req.query.days || 2;
    let lastModified = Date.now() - days * 86400000;
    let project = req.query && req.query.project || "";
    //context.log("1");
    let connectionString = process.env.AzureWebJobsStorage;
    let tableService = azure.createTableService(connectionString);
    let queryString = "LastModified > ?int64?";
    if (project) queryString += " && PartitionKey == ?";
    let query = new azure.TableQuery().where(queryString, lastModified, project);
    //context.log("2");
    let result = await tableQuery(context, tableService, query);
    context.res = {
        headers: { "Content-Type": "application/json;charset=utf-8" },
        body: result
    };
}

function tableQuery(context, tableService, query) {
    return new Promise(function (resolve, reject) {
        //context.log("3");
        tableService.queryEntities("places", query, null, function (error, result, response) {
            if (!error) {
                //context.log("4");
                let table = [];
                for (var i = 0; i < result.entries.length; i++) {
                    let row = result.entries[i];
                    if (row.Deleted && row.Deleted._) continue;                    
                    let id = row.PartitionKey._.replace(" ", "+") + "%7C" + row.RowKey._;
                    table.push({
                        user: row.User._,
                        id: id,
                        title: row.Text._.replace(/(<div|<p|<br).*/s, "").replace(/<[^>]*>/g, "")
                    });
                }
                resolve(table);
            } else {
                //context.log("7");
                reject(error);
            }
        })
    });
}
