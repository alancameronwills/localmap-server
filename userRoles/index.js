let azure = require('azure-storage');

/** 
 * 1. Check requesting user is admin on the project
 * 2. Apply any requested change to user role on the project. 
 * 3. Return all current users with roles on this project, and also users with no roles on any project
 * @param {*} project - project id -- inferred if you are admin on one project
 * @param {*} user - RowKey of known user - i.e. user who has signed in at least once.
 * @param {*} role - role to set for that user. Omit to just remove existing role.
 */

module.exports = function (context, req) {

    // https://docs.microsoft.com/en-us/azure/cosmos-db/table-storage-how-to-use-nodejs#delete-an-entity

    // Table entries are of form {property:{"_":value},...}
    let x = (u, p) => u && u[p] ? u[p]._ : "";

    // Requesting user must be signed in through Microsoft or Google.
    // If so, Azure adds this header to each incoming request:
    let adminUserId = req.headers["x-ms-client-principal-id"] || "";
    if (!adminUserId) {
        context.res = { status: 401, body: "Not signed in" };
        context.done();
        return;
    }

    let project = (req.query && req.query.project || "").toLowerCase();
    let userId = (req.query && req.query.user) || "";
    let newRole = ((req.query && req.query.role) || "").toLowerCase();

    let tableService = azure.createTableService(process.env.AzureWebJobsStorage);

    // Get the whole table:
    tableService.queryEntities("users", null, null, (error, result) => {
        if (!result || result.entries.length == 0) {
            context.res = { status: 500, body: "User table access: " + error };
            context.done();
            return;
        }
        // PartitionKey is ignored. RowKey is Azure sign-in id.
        let adminUser = result.entries.find(u => u.RowKey._ == adminUserId);
        let adminRole = x(adminUser, "Role").toLowerCase();
        if (!project && adminRole != "admin") {
            let adminOf = adminRole.split(";").find(r=>r.indexOf("admin:")==0);
            if (adminOf) project = adminOf.split(":")[1];
        }
        // Role format is either just "admin" for superadmin, or "admin:project1;contributor:project2;..."
        let ok = adminRole == "admin" || project && adminRole.split(";").some(r => r == "admin:" + project);
        if (!ok) {
            context.res = { status: 401, body: "Not authorized" };
            context.done();
            return;
        }
        // User is authorized, so whatever the outcome we can return the table of users:
        let userTable = adminRole == "admin" 
            ? result.entries 
            // Project admins see users with a defined role on their project, and users who have signed in but have no role yet:
            : result.entries.filter(u=>{let role = x(u,"Role"); return !role || role.indexOf(":"+project)>=0;});
        context.res = { status: 200, body: {myId: adminUserId, myRole:adminRole, project:project, users:userTable }};
        // (Although we may be about to change one of the entries in place)

        let user = userId && userTable.find(u=>u.RowKey._==userId);
        if (user && project && userId != adminUserId) {
            // Get existing roles, but exclude this project:
            let userRoles = x(user, "Role").toLowerCase()
                .split(";")
                .filter(r=>r && r.indexOf(":"+project)<0); // all but this project
            if (newRole) userRoles.push(newRole+":"+project);
            // Update in place, for returning as HTML result:
            user.Role = {"_":userRoles.join(";")};
            let update = {PartitionKey: {"_":user.PartitionKey._},RowKey:{"_":userId},Role:user.Role};
            tableService.insertOrMergeEntity("users", update, (error2, result2)=> {
                context.done();
            })
        } else {
            context.done();
        }
    });
}


