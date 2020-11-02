// Sendmail details in console installed modules

const sg = require('sendgrid')(process.env.SendGridApiKey1);
const sgMail = require('@sendgrid/mail');


module.exports = async function (context, req) {
    // context.log("1");
    await send2(context, ["alan@cameronwills.org"], "Test <span style='color:blue'>more</span>");
    await send2(context, ["alancameronwills@gmail.com"], "Test <span style='color:green'>stuff</span>");
    context.res = {
        // status: 200, /* Defaults to 200 */
        body: "Hello "  // (req.query.name || req.body.name)
    };
}
function send(context, recipients, message) {
    let request = sg.emptyRequest({
        method: "POST",
        path: "/v3/mail/send",
        body: {
            personalizations: [
                {
                    to: recipients.map(x => { return { email: x } }),
                    subject: "Deep Map recent contributions"
                }
            ],
            from: {
                email: "info@pantywylan.org"
            },
            content: [
                {
                    type: "text/html",
                    value: message
                }
            ]
        }
    });
    context.log("3");
    sg.API(request, (a, b, c) => {
        context.log("4");
        context.log("[" + a + "|" + b + "|" + c);
    });
}

async function send2(context, recipients, message) {
    sgMail.setApiKey(process.env.SendGridApiKey2);
    const msg = {
        to: recipients[0],
        from: 'alan@pantywylan.org', // Use the email address or domain you verified above
        subject: 'Test message',
        text: message,
        html: message,
    };
    (async () => {
        try {
            context.log("31");
            await sgMail.send(msg);
            context.log("41");
        } catch (error) {
            console.error(error);

            if (error.response) {
                console.error(error.response.body)
            }
        }
    })();
}