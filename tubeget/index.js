module.exports = function (context, req, table) {
    context.log("v "+process.version);
    var outtable = table;
    context.res = {
        status: 200,
        body: outtable
    };
    context.done();
}