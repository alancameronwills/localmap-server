// Check whether a given user id is an admin

let azure = require('azure-storage');
module.exports = function (context, req) {

    // https://docs.microsoft.com/en-us/azure/cosmos-db/table-storage-how-to-use-nodejs#delete-an-entity

        var name = req.headers["x-ms-client-principal-nam"];
        req.name = name;
        context.res = {
            status: 200,
            body: req
        };

    let connectionString = process.env.AzureWebJobsStorage;
    let tableService = azure.createTableService(connectionString);
    let query = new azure.TableQuery().where("RowKey eq ?", name);
    context.log("p1 " + query);
    tableService.queryEntities("projects", query, null, 
        function(error, result, response) {
            if(!error) {
                context.res.body.entries = result.entries;
                if (result.entries.length > 0) {
                    context.res.body.name = result.entries[0].name._;
                    context.res.body.role = result.entries[0].role._;

                }
            } else {
                    context.error(error);
                    context.res.status=401;
            }
            context.done();
        }
    );

};