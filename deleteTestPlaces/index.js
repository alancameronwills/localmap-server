// https://docs.microsoft.com/en-us/azure/cosmos-db/table-storage-how-to-use-nodejs#delete-an-entity
// https://docs.microsoft.com/en-us/azure/cosmos-db/table-storage-how-to-use-nodejs#work-with-groups-of-entities

let azure = require('azure-storage');
//let blobService = require('@azure/storage-blob');
module.exports = function (context, req) {
    let connectionString = process.env.AzureWebJobsStorage;
    let tableService = azure.createTableService(connectionString);
    let blobService = azure.createBlobService(connectionString);

    let query = new azure.TableQuery().where("PartitionKey eq ?", process.env.TestProjectId);
    tableService.queryEntities("places", query, null, function(error,result, response) {
        if(error) {
            context.error(error);
            context.res.status=401;
            context.done();
        } else {
            context.res.body = result.entries;
            deleteSet(result);
        }
    });

    function deleteSet(result) {
        context.log("deleting");
        let batch = new azure.TableBatch();
        if (!result.entries) { context.res.body.push("f2"); context.done(); return; }
            result.entries.forEach(element => {
                
            if (element.PartitionKey && element.RowKey && element.RowKey._ != "320501040707199024165") {
                context.log(">> " + element.RowKey);
                element.PartitionKey._ = process.env.TestProjectId;
                batch.deleteEntity (element);
                
                let media = JSON.parse(element.Media._);
                media.forEach(item => {
                    blobService.deleteBlobIfExists("deepmap", "media/" + item.id, (err, res) =>{

                    });
                })
                
            }
            
        });
        if (batch.size()==0) {
            context.log("No elements");
            context.done();
            return;
        } else {
            context.log("Elements: " + batch.size());
        }
        tableService.executeBatch("places", batch, (error, res2, response) => {
            context.log("XX");
            context.log(res2);
            context.done();
        })
        
        
    }
 };