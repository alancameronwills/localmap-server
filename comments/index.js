module.exports = function (context, req, inputTable) {
    // Get the comments related to a given place.
    // Parameters: id=Partition+Key|placeRowKey

    // context.log('JavaScript HTTP trigger function processed a request.');

    if (!req.query.id) {
        context.res = {
            status: 400,
            body: "id missing"
        };
    } else {
        var keys = req.query.id.split("|");
        if (keys.length < 2) {
            context.res = {
                status: 400,
                body: "id needs pk|rk"
            };
        } else {
            var partitionKey = keys[0].replace("+", " ");
            var outputTable = inputTable
                .filter(v => partitionKey == v.PartitionKey && keys[1] == v.Item)
                .sort((a,b)=> a.RowKey.localeCompare(b.RowKey));
            context.res = {
                status : 200,
                body: outputTable
            }
        }
    }
    context.done();
};