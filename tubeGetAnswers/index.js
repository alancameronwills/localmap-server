module.exports = function (context, req, answers, questions) {
    var outtable;
    if (req.query.key) {
        if (req.query.key == "thejudgeandjury") {
            outtable = answers;
        } else {
            outtable = answers.filter(v => v.PartitionKey == req.query.key);
        }
    } else {
        context.res = { status: 400, body: "Bad request" };
        context.done();
        return;
    }
    var competition = req.query.competition || "2020-04-19";
    var qatable = questions.filter(item => item.PartitionKey = competition);
    var crib = new Array(qatable.length);
    qatable.forEach(row => {
        var rk = parseInt(row.RowKey);
        if (rk>=0)
        crib[rk] = {re: new RegExp(row.Answer.toLowerCase().replace(/'/g, "").trim().replace(/ *\| */g, "|")), a:row.Answer, q:row.Question};
    });

    context.res = {
        status: 200,
        body: outtable.map(r => {
            let rk = parseInt(r.RowKey);
            if (rk<0) return {PartitionKey: r.PartitionKey, RowKey: r.RowKey,time:r.time};
            return {
                PartitionKey: r.PartitionKey, RowKey: r.RowKey,
                answer: r.answer, answerKey: r.answerKey, time: r.time,
                correct: crib[rk].re.test(r.answer.toLowerCase().replace(/'/g, "")),
                question: crib[rk].q,
                accept: crib[rk].a
            };
        })
    };
    context.done();
}