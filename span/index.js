module.exports = function (context, req, table) {
    var outtable = table;
    context.res = {
        status: 200,
        body: outtable
    };
    context.done();
}