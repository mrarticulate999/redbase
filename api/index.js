// Vercel serverless entry point.
// All /api/* requests are rewritten here (see vercel.json) and handed to the
// existing Express app. The app is imported without binding a port — see the
// `require.main === module` guard in server/src/index.js.
module.exports = require('../server/src/index.js');
