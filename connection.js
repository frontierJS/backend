import Toolbelt from '@frontierjs/toolbelt'
import sqlite from 'better-sqlite3'

let env = Toolbelt

const opts = {
  //TODO: fix the options
  memory: env.get('DB_USE_MEM') === 'true' ? true : false,
  verbose: env.get('DB_USE_LOG') ? console.log : null,
}

const Connection = sqlite(env.get('DB'), opts)

export default Connection
