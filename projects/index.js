module.exports = function (context, req, table) {
    var outtable = table;
    /*
    if(req.query.after || req.query.project) {
        outtable = table.filter(v => (!req.query.project || (v.PartitionKey == req.query.project)) && (!req.query.after || (v.LastModified > req.query.after)));
    }
    */
    context.res = {
        status: 200,
        body: outtable
    };
    context.done();
}