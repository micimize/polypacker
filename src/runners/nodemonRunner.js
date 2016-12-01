import nodemon from 'nodemon'
import { cyan } from 'colors'
import path from 'path'
import { importantLog } from '../logging'

const nodemonRunner = {
  name: 'nodemon',
  logRun({configuration: {context, out}}){
    importantLog(`running ${cyan(context)} context from ${cyan(out)} with nodemon`)
  },
  run({configuration, args}){
    this.logRun({configuration})
    return nodemon({
      execMap: { js: 'node' },
      script: path.join(process.env.PWD, configuration.out),
      ...args,
      watch: [configuration.out],
    }).on('restart', (files) => {
      importantLog(`restarted ${
        cyan(files.map(f => path.relative(process.cwd(), f)).join(', '))
      }`)
    }).on('quit', () => {
      importantLog(cyan(configuration.context) + " process quit") 
    })
  },
  restart(){
    nodemon.restart()
  }
}

export default nodemonRunner
