const { env } = require('@frontierjs/toolbelt')
const Connection = require('better-sqlite3')(env.get('DB'), { verbose: console.log })

module.exports = Connection
