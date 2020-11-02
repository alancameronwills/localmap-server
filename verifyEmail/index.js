// https://docs.microsoft.com/en-us/azure/cosmos-db/table-storage-how-to-use-nodejs#update-an-entity
// https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-sendgrid?tabs=javascript

let azure = require('azure-storage');

/**
 * Set an email address for a new or existing user, 
 * generate and record a verification token, and send the token to the user by email.
 * @param {*} email - a valid email address (required)
 * @param {*} id - RowKey of a user. Or can be provided in header.
 * @param {*} token - If provided, check against the recorded key. If not provided, send a key. 
 */
module.exports = function (context, req, res, message) {

    let token = (req.query.token || (req.body ? req.body.token : "")).trim();
    let email = (req.query.email || (req.body ? req.body.email : "")).trim().toLowerCase();
    let id = (req.query && req.query.id) || req.headers["x-ms-client-principal-id"] || email;
    if (!id || !email && !token) {
        context.res = {
            status: 400,
            body: "Need id and email or token"
        };
        context.done();
    } else {
        res = { status: 200, body: "ok" };
        let connectionString = process.env.AzureWebJobsStorage;
        let tableService = azure.createTableService(connectionString);

        // If we have an email and no token, record email, generate token and send it
        // If we have a token, check it and if correct blank it

        let query = new azure.TableQuery().where("RowKey eq ?", id);
        tableService.queryEntities("users", query, null,
            (error, result, response) => {
                if (result.entries && result.entries.length > 0) {
                    try {
                        if (token) checkValidationKey(context, tableService, result.entries[0], token);
                        else setValidationKey(context, tableService, result.entries[0], email, message);
                    } catch (e) {
                        context.res = { status: 500, body: "" + e };
                        context.done();
                    }
                } else {
                    context.res = {
                        status: 400,
                        body: "No user with id: " + id
                    };
                    context.done();
                }
            });
    }
};

/** Check the token against that stored in the user record. Return in status. If OK, nullify token in record.
 * 
 */
function checkValidationKey(context, tableService, row, token) {
    if (row.validation._ != token) {
        context.log("Wrong token " + row.RowKey._);
        context.res = { status: 401, body: "Wrong token" };
        context.done();
    } else {
        // context.log("Verified " + row.PartitionKey._ + " " + row.RowKey._);
        context.res = { status: 200, body: "ok" };
        try {
            tableService.mergeEntity("users",
                {
                    PartitionKey: { "_": row.PartitionKey._ }, RowKey: { "_": row.RowKey._ },
                    validation: { "_": "" }
                },
                (error, result, response) => {
                    context.done();
                }
            );
        } catch (e) {
            context.log("Table error " + e);
            context.done();
        }
    }
}

/**  Generate a validation token, store it in validation field, send it to user.
 * @param {*} context - Azure functions context
 * @param {*} tableService - Azure table service
 * @param {*} message - The message to be sent
 * @param {*} email - The user's email address
 * @param {*} key The RowKey of the new or existing record with the user's email address
 */
function setValidationKey(context, tableService, row, email, message) {
    let token = ("" + Date.now()).substr(-4);
    let link = "https://deepmap.azurewebsites.net/validate-email.htm?token=" + token;
    let name = row.FullName ? row.FullName._ : "";
    let tokenMessage = `Hi ${name},\n\nPlease use this code to validate your email address: ${token}` + "\n\nBest wishes\nDeep Map\n";
    let item = {
        PartitionKey: { "_": row.PartitionKey._ },
        RowKey: { "_": row.RowKey._ },
        email: { "_": email },
        validation: { "_": token }
    };
    tableService.insertOrMergeEntity("users", item, (error, result, response) => {
        context.log("Sending code to " + email);
        context.res = { status: 201, body: "Sent code to " + email };
        context.bindings.message = {
            "personalizations": [{ "to": [{ "email": email }] }],
            content: [{
                type: 'text/plain',
                value: tokenMessage
            }]
        };
        context.done();
    });
}

/*

*/