const { env } = require('@frontierjs/toolbelt')

const opts = {
    memory: env.get('DB_USE_MEM') ? true : false,
    verbose: env.get('DB_USE_LOG') ? console.log : null
}

const Connection = require('better-sqlite3')(env.get('DB'), opts)

module.exports = Connection
