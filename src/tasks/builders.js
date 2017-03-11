import identity from '../identity'
import { onBuild, polypack } from './utils'
import { log, importantLog, logImportantFromToAction } from '../logging'

export function watchTask({ onWatch }){
  function watch(configurations){
    let task = watch
    task.state = { count: 0, compilers: []}
    task.cleanUp = callback => {
      if(task.state.count){
        log('\n')
        importantLog('stopping watchers.')
      }
      task.state.compilers.forEach(watcher => {
        watcher.close(_ => {
          logImportantFromToAction("stopped compiling", watcher, 'magenta')
          task.state.count -= 1
          if(!task.state.count){
            importantLog('all watchers stopped. Polypacker exited cleanly')
            callback(0)
          }
        })
      })
    }

    let waiting = configurations.length
    let results = {}
    return new Promise((resolve, reject) => {
      configurations.map(configuration => {
        logImportantFromToAction("watching and distributing", configuration)
        let watcher = polypack(configuration).watch(250, (err, stats) => {
          results[configuration[identity].signature] = onBuild(err, stats, configuration)

          onWatch(configuration)

          waiting -= 1
          if(!waiting){
            resolve(results)
          }
        })
        watcher[identity] = configuration[identity]
        task.state.count += 1
        task.state.compilers.push(watcher)
      })
      setTimeout(_ => {
        if(waiting){
          reject(new Error(`compiler timed out with the results ${results}`))
        }
      }, 100000)
    })
  }
  return watch
}

