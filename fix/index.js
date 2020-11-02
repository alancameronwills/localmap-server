// One-off update

let azure = require('azure-storage');
module.exports =  function (context, req) {

    // https://docs.microsoft.com/en-us/azure/cosmos-db/table-storage-how-to-use-nodejs#delete-an-entity

    let connectionString = process.env.AzureWebJobsStorage;
    let tableService = azure.createTableService(connectionString);
    let query = new azure.TableQuery()
        .where("PartitionKey == ?string? && Group == ? && Latitude > ? && Latitude < ? && Longitude < ?", "Garn Fawr", 
        "", 51.85,53.0,-3.03); 
    context.log("p13");
    setTimeout(()=>{context.log("timeout"); context.done();}, 10000);
    try {
    tableService.queryEntities("places", query, null,
        function (error, result, response) {
            if (result.entries && result.entries.length > 0) {
                let todo = [];
                context.log("Entries: " + result.entries.length);
                result.entries.forEach(item => {
                        todo.push(item.RowKey._);
                        context.log(item.Text._.substr(0, 10));
                });
                //xxx(context);
                //context.done();
                doItems(context, tableService, todo, 0);
                context.log("complete");
                context.done();
            }
            else { context.log("eeee"); context.done(); }
        }
    );
    } catch (ex) {
        context.log("ex");
        context.done();
    }

};
function xxx(context) {
    context.log("xxx");
}
function doItems(context, tableService, todo, counter) {
    context.log("doItems " + todo.length);
    if (counter > 60) { context.done(); return; }
    
    if (todo.length > 0) {
        let row = todo.pop();
        context.log("XXX " + row);
        tableService.mergeEntity("places", {
            PartitionKey: { "_": "Garn Fawr" },
            RowKey: { "_": row },
            Group: { "_": "Gogledd Sir Benfro" }
        }, (error, result, response) => {
            if (!error) {
                doItems(context, tableService, todo, counter + 1);
            }
        });
    } else {
        context.done();
    }
    
}