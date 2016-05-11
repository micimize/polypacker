import colors from 'colors'
import webpack from 'webpack'
import path from 'path'
import nodemon from 'nodemon'
import ON_DEATH from 'death'

import webpackConfig from './webpack-config'
import configure from './argparser'

import { log, importantLog, logImportantFromToAction } from './logging'

var watching = {
    count: 0,
    compilers: []
}

function compoundVersion(options){
    var context = options.context,
        env     = options.env || process.env.NODE_ENV && process.env.NODE_ENV.toUpperCase() || 'DEVELOPMENT';
    return (context && env) ? context.toLowerCase() + '_' + env.toLowerCase() : 'index'
}

function onBuild(err, stats, configuration) {
    var compound_version = compoundVersion(configuration)
    var status = 'success'
    if(err) {
      importantLog(colors.red(`Errors while building ${compound_version}!`), {color: 'red'})
      log('Error', err);
      status = 'error'
    } else if(stats.hasErrors()) {
      importantLog(colors.red(`Errors while building ${compound_version}!`), {color: 'red'})
      log(stats.toString({colors: true, errorDetails: true}));
      status = 'error'
    } else {
        importantLog('successfully built ' + colors.cyan(compound_version))
    }
    if(configuration.logLevel == 'VERBOSE') {
      log(stats.toString({colors: true}));
    }
    return {
        compiler: compound_version,
        status
    }
}

function endWatch(watcher) {
    watcher.close(function(){
        logImportantFromToAction("stopped compiling", watcher._polypackConfiguration, 'magenta')
        watching.count -= 1
        if(!watching.count){
            importantLog('all watchers stopped. Polypacker exited cleanly')
            process.exit(0)
        }
    })
}

function compileForAllConfigurations(configurations){
    let waiting = configurations.length
    let results = {}
    return new Promise((resolve/*, reject*/) => {
        //resolve(results)
        configurations.map(configuration => {
            logImportantFromToAction("distributing", configuration)
            webpack(webpackConfig(configuration)).run((err, stats) => {
                results[compoundVersion(configuration)] = onBuild(err, stats, configuration)
                waiting -= 1
                if(!waiting){
                    resolve(results)
                }
            })
        })/*
        setTimeout(() => {
            if(waiting)
                reject(new Error(`compiler timed out with the results ${results}`))
        }, 100000)*/
    })
}

var contextWatchActions = {
    NODE: ({watch, run}) => watch && run ** nodemon.restart()
}

function watchAllConfigurations(configurations){
    let waiting = configurations.length
    let results = {}
    return new Promise((resolve, reject) => {
        watching.compilers = configurations.map(configuration => {
            logImportantFromToAction("watching and distributing", configuration)
            var watcher = webpack(webpackConfig(configuration)).watch(250, (err, stats) => {
                results[compoundVersion(configuration)] = onBuild(err, stats, configuration)
                if(contextWatchActions[configuration.context]){
                    contextWatchActions[configuration.context](configuration)
                }
                waiting -= 1
                if(!waiting){
                    resolve(results)
                }
            })
            watcher._polypackConfiguration = configuration
            watching.count += 1
            return watcher
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
          importantLog("runnning " + colors.cyan(configuration.context) + " context from " +  colors.cyan(configuration.out))
          nodemon({
              execMap: { js: 'node' },
              script: path.join(process.env.PWD, configuration.out),
              args: unknown,
              ignore: ['*'],
              watch: ['nothing/'],
              ext: 'noop'
          }).on('restart', () => {
              importantLog('Patched!')
          })
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
    'dist': compileForAllConfigurations,
    'watch': watchAllConfigurations,
    'run': chain(compileForAllConfigurations, runSelectedContext),
    'watch-and-run': chain(watchAllConfigurations, runSelectedContext)
}

function exit({error} = {}){
    if(error){
        console.log(error)
        throw error
    }
    if(watching.count){
        log('\n')
        importantLog('stopping watchers.')
        watching.compilers.map(endWatch)
    } else {
        importantLog('Polypacker exited cleanly.')
    }
}

export default function runTask({config: {compilers, task}, unknown}){
    return tasks[task](compilers, {unknown}).then(exit).catch(error => exit({error}))
}

ON_DEATH((signal, error) => exit({error}))
