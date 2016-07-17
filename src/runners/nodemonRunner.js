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
            args,
            ignore: ['*'],
            watch: ['nothing/'],
            ext: 'noop'
        }).on('restart', () => {
            importantLog('Patched!')
        }).on('quit', () => {
            importantLog(colors.cyan(configuration.context) + " process quit") 
        })
    },
    restart(){
        nodemon.restart()
    }
}

export default nodemonRunner
