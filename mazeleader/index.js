let azure = require('azure-storage');
module.exports = function (context, req) {
    if (!req.query.level) {
        context.res = {
            status: 400,
            body: "Need level"
        };
        context.done();
        return;
    }

    let connectionString = process.env.AzureWebJobsStorage;
    let tableService = azure.createTableService(connectionString);

    if (req.query.name && req.query.time) {
        //context.log("1");
        let t = parseInt(req.query.time);
        if (t > 0 && t < 4000) {
            let row = { PartitionKey: req.query.level, RowKey: req.query.uid, Name: req.query.name, Time: t };
            //context.log("2");
            tableService.insertOrReplaceEntity('maze', row, (error, result, response) => {
                //context.log("3");
                respond(context, tableService, req.query.level, req.query.name, t);
            });
        } else {
            //context.log("4");
            respond(context, tableService, req.query.level, req.query.name, 0);
        }
    }
    else {
        //context.log("5");
        respond(context, tableService, req.query.level, req.query.name, 0);
    }
};

function respond(context, tableService, level, name, time) {
     var twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate()-14);
    var query = new azure.TableQuery()
        .where('PartitionKey eq ?', level)
        .and ("Timestamp gt ?", twoWeeksAgo)
        ;
    //context.log("10");
    tableService.queryEntities('maze', query, null, function (error, result, response) {
        //context.log("11");
        if (!error) {
            //context.log("12");
            context.res = {
                // status: 200, /* Defaults to 200 */
                body: result.entries
            }
        }
        else {
            //context.log("13");
            context.res = {
                status: 400,
                body: error
            }
        }
        context.done();
    });
}

/*
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
        if (req.body.Text.length > 0) {
            req.body.LastModified = Date.now();
            // context.log("upload " + req.body.RowKey);
            // context.log(JSON.stringify(req.headers));
            tableService.insertOrReplaceEntity('comments', req.body, (error, result, response) => {
                context.res.status = error ? 401 : 204;
                context.done();
            });
*/