const { env } = require('@frontierjs/toolbelt')
console.log('something')
console.log(env.get('DB'))

const opts = {
  //TODO: fix the options
  memory: env.get('DB_USE_MEM') === 'true' ? true : false,
  verbose: env.get('DB_USE_LOG') ? console.log : null
}

const Connection = require('better-sqlite3')(env.get('DB'), opts)

module.exports = Connection
