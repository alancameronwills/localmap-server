module.exports = function (context, req, table) {
    context.log('JavaScript HTTP trigger function processed a request.');

    //if (req.query.name || (req.body && req.body.name)) {

        outputTable = table.filter(v => v.LastModified > req.query.tude);
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: "hello " + JSON.stringify(outputTable)
        };
        context.done();
   
};