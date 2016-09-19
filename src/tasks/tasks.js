import defaultRunner  from '../runners'
import identity, { sign } from '../identity'

import { onBuild, polypack } from './utils'
import { watchTask } from './builders'

import { log, importantLog, logImportantFromToAction, logCompilation } from '../logging'

export function compileAll(configurations){
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

export const watchAll = watchTask({
    onWatch(configuration){
        if(contextWatchActions[configuration.context]){
            contextWatchActions[configuration.context](configuration)
        }
    }
})

export async function runSelected(configurations, { unknown, run }){
  configurations.map(configuration => {
      if(configuration.context == run){
          let { runner = defaultRunner } = configuration
          runner.run({configuration, args: unknown})
      }
  })
}

