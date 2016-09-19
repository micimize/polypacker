import identity, { sign } from '../identity'
import { log, importantLog, logImportantFromToAction, logCompilation } from '../logging'

import webpack from 'webpack'
import webpackConfig from '../webpacker'

export function polypack(configuration){
  let compiler = webpack(webpackConfig(configuration))
  compiler[identity] = configuration[identity]
  return compiler
}

export function onBuild(err, stats, {logLevel, [identity]: {signature}}) {
  return logCompilation(err, stats, {logLevel, signature})
}

export function chain(...fns){
  async function chained(...args) {
    for (let fn of fns){
      await fn(...args)
    }
  }
  let cleanUpFns = fns.map(fn => fn.cleanUp).filter(cleanUp => cleanUp)
  if(cleanUpFns.length){
    chained.cleanUp = chain(...cleanUpFns)
  }
  return chained
}

export function exit({ err, task } = {}){
  if(err){
    console.log(err)
    throw err
  }
  if(task && task.cleanUp){
    task.cleanUp((signal = 0) => {
      importantLog('Polypacker exited cleanly.')
      process.exit(0)
    })
  } else {
    process.exit(0)
  }
}

