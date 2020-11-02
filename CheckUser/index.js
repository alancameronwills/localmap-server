let azure = require('azure-storage');

// Look up a user in our users table.
// id is 3rd party credentials (x-ms-) or can be provided explicitly.
// If not in the table but there is an id, add the new user to the table.
// If query includes name, display name, or role, insert them in the table entry.
// Return the req including headers, and the row in the table.

module.exports = function (context, req) {

    // https://docs.microsoft.com/en-us/azure/cosmos-db/table-storage-how-to-use-nodejs#delete-an-entity

    let principal = (req.query && req.query.principal) || req.headers["x-ms-client-principal-name"] || "";
    let id = (req.query && req.query.id) || req.headers["x-ms-client-principal-id"] || "";
    let idp = (req.query && req.query.idp) || req.headers["x-ms-client-principal-idp"] || "email";
    let name = (req.query && req.query.name) || (principal.indexOf("@") < 0 ? principal : "");
    let email = (req.query && req.query.email) || (principal.indexOf("@") < 0 ? "" : principal);
    let display = (req.query && req.query.display) || "";
    let role = (req.query && req.query.role) || "";

    context.res = {
        status: 200,
        body: req
    };
    if (!id) {
        context.done();
        return;
    }
    let connectionString = process.env.AzureWebJobsStorage;
    let tableService = azure.createTableService(connectionString);
    let query1 = new azure.TableQuery().where("RowKey eq ?", id);
    let query2 = email ? new azure.TableQuery().where("RowKey eq ?", email) : null;
    let found = (result) => {
        context.log("5 found row");
        // Found a row.
        try {
            let row = result.entries[0];
            // Is there new info to add?
            let update = { PartitionKey: { "_": row.PartitionKey._ }, RowKey: { "_": row.RowKey._ } };
            let todo = false;
            let up = (k, v) => {
                if (v && (!row[k] || v != row[k]._)) {
                    update[k] = { "_": v };
                    context.res.body.entries[0][k] = update[k];
                    todo = true;
                }
            }
            up("FullName", name);
            up("email", email);
            up("DisplayName", display);
            if (todo) {
                context.log("6 updating row...");
                tableService.insertOrMergeEntity("users", update, (errorupd, resultupd, responseupd) => {
                    context.log("7 updated");
                    done(context);
                })
            } else {
                context.log("8 no updates");
                done(context);
            }
        } catch (e) {
            context.log("oops " + e);
            done(context);
        }
    }
    let notfound = () => {
        context.log("3 not found");
        // Add a row for the new user.
        let update = {
            PartitionKey: { "_": "Garn Fawr" },
            RowKey: { "_": id },
            Authentication: { "_": idp },
            FullName: { "_": name },
            DisplayName: { "_": display },
            email: { "_": email },
            Role: { "_": role }
        };

        tableService.insertOrMergeEntity("users", update, (errorupd, resultupd, responseupd) => {
            context.log("4 added row");
            context.res.body.entries[0] = update;
            done(context);
        });
    }
    context.log("1 query id");
    tableService.queryEntities("users", query1, null,
        function (error, result, response) {
            if (!error) {
                context.res.body.entries = result.entries;
                if (result.entries.length > 0) {
                    found(result);
                } else {
                    // Might be old-style email id
                    if (query2) {
                        context.log("2 query email");
                        tableService.queryEntities("users", query2, null,
                            function (error2, result2, response2) {
                                context.res.body.entries = result2.entries;
                                if (result2.entries.length > 0) {
                                    found(result2);
                                } else {
                                    notfound();
                                }
                            })
                    } else {
                        notfound();
                    }
                }
            } else {
                context.error(error);
                context.res.status = 401;
                context.done();
            }
        }
    );

};
function done(context) {
    let entries = context.res.body.entries;
    if (entries.length > 0) {
        let e0 = entries[0];
        let shorten = (k, short) => { if (e0[k] && e0[k]._) context.res.body[short] = e0[k]._; }
        shorten("FullName", "name");
        shorten("DisplayName", "name");
        shorten("Role", "role");
        shorten("email", "email");
    }
    context.done();
}

