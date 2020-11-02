
module.exports = async function (context, myTimer, inputTable) {
    var timeStamp = new Date().toISOString();
    
    if (myTimer.IsPastDue)
    {
        context.log('JavaScript is running late!');
    }
    context.log('KeepAwake ' + inputTable.length, timeStamp);   
};