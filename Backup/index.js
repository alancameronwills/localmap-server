module.exports = function (context, myTimer, inputTable) {
    context.done(null, JSON.stringify(inputTable));
};