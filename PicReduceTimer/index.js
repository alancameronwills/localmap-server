// See function.json for timings.
// node-fetch included in ../package.json
const fetch = require("node-fetch");
module.exports = async function (context, myTimer) {
    await fetch ("https://deep-map.azurewebsites.net/api/PicReduceAll");
};