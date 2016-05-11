import fs from 'fs'
import { clone, parserFromArgumentMap, flatten } from './utils'
import argumentMap from './argumentMap'

function splitByContext(args){
    if(Array.isArray(args)){
        return flatten(args.map(splitByContext))
    }
    var contexts = args.contexts
    delete args.contexts
    return contexts ? contexts.map(function(context){
        var contextArgs = clone(args)
        contextArgs.context = context
        return contextArgs
    }) : [args]
}

function splitByEnv(args){
    if(Array.isArray(args)){
        return flatten(args.map(splitByEnv))
    }
    var envs = args.environments
    delete args.environments
    return envs ? envs.map(function(env){
        var envArgs = clone(args)
        envArgs.env = env
        return envArgs
    }) : [args]
}

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

function selectTask(conf){
    if(conf.watch && conf.run){
        return 'watch-and-run'
    } else if(conf.watch){
        return 'watch'
    } else if (conf.run) {
        return 'run'
    } else {
        return 'dist'
    }
}

function taskWrapper(compilers, task, meta){
    return {
        task: task || 'dist', 
        compilers: compilers,
        meta: meta || {logLevel: compilers[0].logLevel || 'ERROR'}, 
    }
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
var presets = {
    NODE_COMPONENT: function(args){ return taskWrapper([defaultContextualComponent(args)]) },
    BROWSER_COMPONENT: function(args){ return taskWrapper([defaultContextualComponent(args)]) },
    FULLSTACK_COMPONENT: function(args){
        handleIndexTemplate() // TODO: this and splitByContext don't handle args.out like they should
        args.contexts = ['NODE', 'BROWSER']
        args.environments = ['DEVELOPMENT', 'PRODUCTION']
        var contexts = splitByContext(args)
        var compilers = splitByEnv(contexts).map(defaultContextualComponent)
        return taskWrapper(compilers, args.watch ? 'watch' : 'dist')
    },
    NODE_APPLICATION: function(args){
        args.context = 'NODE'
        delete args.contexts
        args.out = args.out || './dist/index.js'
        args.run = true
        args = defaultContextualComponent(args)
        args = splitByEnv(args)
        return taskWrapper(args, args.watch ? 'watch-and-run' : 'run')
    },
    FULLSTACK_APPLICATION: function(args){
        args.contexts = ['NODE', 'BROWSER']
        var contexts = splitByContext(args)
        for (i = 0; i < contexts.length; i++) {
            contexts[i] = defaultContextualComponent(contexts[i])
            contexts[i].run = ( contexts[i].context == 'NODE' )
        }
        return taskWrapper(contexts, args.watch ? 'watch-and-run' : 'run')
    }
}

function metaArgs(conf){
    return {logLevel: conf.logLevel}
}

function applyPreset(args){
    var preset = args.preset
    delete args.preset

    if (preset && presets[preset]) {
        return presets[preset](args)
    } else {
        var contexts = splitByContext(args)
        var compilers = splitByEnv(contexts)
        return taskWrapper(compilers, selectTask(args), metaArgs(args))
    }
}
var parser = parserFromArgumentMap(argumentMap)

export default function configure(argstring){
    let args = parser.parseKnownArgs(argstring && argstring.trim().split(/ +/))
    return {
        config: applyPreset(args[0]),
        unknown: args[1]
    }
}
