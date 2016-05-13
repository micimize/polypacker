import fs from 'fs'
import { taskWrapper, splitByContext, splitByEnv } from './utils'

function fromSrcDir(args){
    args.entry = args.entry || './src/index.js'
    args.modules = args.modules || './src'
    return args
}

function defaultContextualComponent(args){
    args = fromSrcDir(args)
    args.out = args.out || args.context &&
        './dist/for/' + args.context.toLowerCase() + '_' + args.env.toLowerCase() + '.js'
    return args
}

function handleIndexTemplate(){
    try {
        fs.lstatSync('./dist/index.js')
    } catch(err){
        fs.mkdir('./dist')
        fs.createReadStream(__dirname + '/templates/fullstackComponentIndex.js')
            .pipe(fs.createWriteStream('./dist/index.js'))
    }
}

export function NODE_COMPONENT(args){
    return taskWrapper([defaultContextualComponent(args)])
}

export function BROWSER_COMPONENT(args){
    return taskWrapper([defaultContextualComponent(args)])
}

export function FULLSTACK_COMPONENT(args){
    handleIndexTemplate() // TODO: this and splitByContext don't handle args.out like they should
    args.contexts = ['NODE', 'BROWSER']
    args.environments = ['DEVELOPMENT', 'PRODUCTION']
    var contexts = splitByContext(args)
    var compilers = splitByEnv(contexts).map(defaultContextualComponent)
    return taskWrapper(compilers, args.watch ? 'watch' : 'dist')
}

export function NODE_APPLICATION(args){
    args.context = 'NODE'
    delete args.contexts
    args.out = args.out || './dist/index.js'
    args.run = true
    args = defaultContextualComponent(args)
    args = splitByEnv(args)
    return taskWrapper(args, args.watch ? 'watch-and-run' : 'run')
}

export function FULLSTACK_APPLICATION(args){
    args.contexts = ['NODE', 'BROWSER']
    var contexts = splitByContext(args)
    for (i = 0; i < contexts.length; i++) {
        contexts[i] = defaultContextualComponent(contexts[i])
        contexts[i].run = ( contexts[i].context == 'NODE' )
    }
    return taskWrapper(contexts, args.watch ? 'watch-and-run' : 'run')
}
