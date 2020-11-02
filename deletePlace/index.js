// https://docs.microsoft.com/en-us/azure/cosmos-db/table-storage-how-to-use-nodejs#delete-an-entity

let azure = require('azure-storage');
module.exports = function (context, req) {
    let connectionString = process.env.AzureWebJobsStorage;
    let tableService = azure.createTableService(connectionString);

    if (!req.query.partitionKey || !req.query.rowKey) {
        context.res.status = 400;
    } else {
        context.log("delete "+ req.query.partitionKey + " | " + req.query.rowKey );
        tableService.deleteEntity("places", {
                PartitionKey: { '_' : req.query.partitionKey}, 
                RowKey: { '_' : req.query.rowKey}
            },
            function(error, response){
                if(error) {
                    context.error(error);
                    context.res.status=401;
                }
            }
        );
    }
    context.done();
 };