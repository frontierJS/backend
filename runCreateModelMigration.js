import { env, logger, args } from '@frontierjs/backend'
const log = logger
//const argv = require('@frontierjs/toolbelt/lib/args')
import fs from 'fs'
import path from 'path'

//This should be in frontier
let tryIt = function (fn, ...arguments) {
  console.log(arguments)
  try {
    return fn(...arguments)
  } catch (err) {
    //pretty log it
    log.err(err)
  }
}

let modelPath = (() => {
  let p = path.resolve(process.cwd() + '/src/Models')
  return p.slice(0, p.lastIndexOf('/')) + '/Models/'
})()

let modelFiles = []
if (args.models) {
  modelFiles = args.models.split(',')
} else {
  modelFiles = tryIt(fs.readdirSync, modelPath)
}

modelFiles.forEach((file) => {
  let model = require(modelPath + file)
  console.log(model)
  let stmt = model.createTable()
  log.info({ stmt })
})
