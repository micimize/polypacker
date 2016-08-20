import colors from 'colors'
import webpack from 'webpack'
import path from 'path'
import ON_DEATH from 'death'

import webpackConfig from './webpacker'
import configure from './parser'
import defaultRunner  from './runners'
import identity, { sign } from './identity'

import { log, importantLog, logImportantFromToAction, logCompilation } from './logging'

var watching = {
    count: 0,
    compilers: []
}

const polywatch = Symbol(polywatch)

function endWatch(watcher) {
    watcher.close(function(){
        logImportantFromToAction("stopped compiling", watcher, 'magenta')
        watching.count -= 1
        if(!watching.count){
            importantLog('all watchers stopped. Polypacker exited cleanly')
            process.exit(0)
        }
    })
}

function polypack(configuration){
    let compiler = webpack(webpackConfig(configuration))
    compiler[identity] = configuration[identity]
    compiler[polywatch] = (...args) => {
        let watcher = compiler.watch(...args)
        watching.count += 1
        watcher[identity] = configuration[identity]
        watching.compilers.push(watcher)
        return watcher
    }
    return compiler
}

function onBuild(err, stats, {logLevel, [identity]: {signature}}) {
    return logCompilation(err, stats, {logLevel, signature})
}

export function run(configuration, callback=_=>_){
    polypack(configuration).run((err, stats) => {
        results[configuration[identity].signature] = onBuild(err, stats, configuration)
        callback({results})
    })
} 

function compileForAllConfigurations(configurations){
    let waiting = configurations.length
    let results = {}
    let rejection = null
    return new Promise((resolve, reject) => {
        configurations.map(configuration => {
            logImportantFromToAction("distributing", configuration)
            polypack(configuration).run((err, stats) => {
                results[configuration[identity].signature] = onBuild(err, stats, configuration)
                waiting -= 1
                if(!waiting){
                    resolve(results)
                }
            })
        })
        if(!rejection){
            rejection = setTimeout(_ => {
                if(waiting)
                    reject(new Error(`compiler timed out with the results ${results}`))
            }, 100000)
        }
    })
}

var contextWatchActions = {
    NODE: ({watch, run, runner = defaultRunner}) => watch && run && runner.restart()
}

function watchAllConfigurations(configurations){
    let waiting = configurations.length
    let results = {}
    return new Promise((resolve, reject) => {
        configurations.map(configuration => {
            logImportantFromToAction("watching and distributing", configuration)
            polypack(configuration)[polywatch](250, (err, stats) => {
                results[configuration[identity].signature] = onBuild(err, stats, configuration)
                if(contextWatchActions[configuration.context]){
                    contextWatchActions[configuration.context](configuration)
                }
                waiting -= 1
                if(!waiting){
                    resolve(results)
                }
            })
        })
        setTimeout(() => {
            if(waiting)
                reject(new Error(`compiler timed out with the results ${results}`))
        }, 100000)
    })
}

async function runSelectedContext(configurations, {unknown}){
  configurations.map(configuration => {
      if(configuration.run){
          let { runner = defaultRunner } = configuration
          runner.run({configuration, args: unknown})
      }
  })
}

function chain(...fns){
    return async function(...args) {
        for (let fn of fns){
            await fn(...args)
        }
    }
}

const tasks = {
    'dist': chain(compileForAllConfigurations, exit),
    'watch': watchAllConfigurations,
    'run': chain(compileForAllConfigurations, runSelectedContext),
    'just-run': runSelectedContext,
    'watch-and-run': chain(watchAllConfigurations, runSelectedContext)
}

function exit({err} = {}){
    if(err){
        console.log(err)
        throw err
    }
    if(watching.count){
        log('\n')
        importantLog('stopping watchers.')
        watching.compilers.map(endWatch)
    } else {
        importantLog('Polypacker exited cleanly.')
        process.exit(0)
    }
}

export default function runTask({config: {compilers, task}, unknown, callback = _=>_}){
    return tasks[task](compilers.map(sign), {unknown}).then(callback).catch(err => exit({err}))
}

ON_DEATH((signal, err) => exit({err}))
