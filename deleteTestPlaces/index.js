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
        let batch = new azure.TableBatch();
        result.array.forEach(element => {
            if (element.RowKey._ != "320501040707199024165") {
                element.PartitionKey._ = process.env.TestProjectId;
                batch.deleteEntity (element);
                let media = JSON.parse(element.Media._);
                media.forEach(item => {
                    blobService.deleteBlobIfExists("deepmap", "media/" + item.id, (err, res) =>{

                    });
                })
            }
        });
        tableService.executeBatch("places", batch, (error, res2, response) => {
            context.res.body += res2;
            context.done();
        })
    }
 };