// needed cd ..; npm install azure-storage
// https://anthonychu.ca/post/azure-functions-update-delete-table-storage/
// https://www.npmjs.com/package/azure-storage
// https://docs.microsoft.com/en-us/azure/cosmos-db/table-storage-how-to-use-nodejs#update-an-entity

let azure = require('azure-storage');
module.exports = function (context, req) {
    let connectionString = process.env.AzureWebJobsStorage;
    let tableService = azure.createTableService(connectionString);
    //context.log(JSON.stringify(req.body));
    if (req.body.RowKey) {
        req.body.LastModified = Date.now();
        context.log("upload " + req.body.RowKey);
        // context.log(JSON.stringify(req.headers));
        tableService.insertOrReplaceEntity('places', req.body, (error, result, response) => {
            context.res.status= error ? 401 : 204;
            context.done();
        });
    }
    else {
        context.res.status= 400;
        context.done();
    }
};