var fs = require('fs')
var ArgumentParser = require('argparse').ArgumentParser

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor() || {}
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function addArgumentMapToParser(parser, argumentMap){
    for (var key in argumentMap) {
        if (argumentMap.hasOwnProperty(key)) {
            var argAliases = argumentMap[key].aliases || []
            argAliases.unshift('--' + key)
            parser.addArgument(argAliases, argumentMap[key])
        }
    }
    return parser
}

function parserFromArgumentMap(argumentMap){
    var parser = new ArgumentParser({
        version: '0.0.1',
        addHelp: true,
        description: 'context-driven js distribution tool for multiple environments'
    })
    return addArgumentMapToParser(parser, argumentMap)
}

function flatten(arrays){
    return [].concat.apply([], arrays);
}

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

function taskWrapper(compilers, task){
    return {
        task: task || 'dist', 
        compilers: compilers
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
        var compilers = splitByEnv(contexts)
        for (i = 0; i < compilers.length; i++) {
            compilers[i] = defaultContextualComponent(compilers[i])
        }
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

function applyPreset(args){
    var preset = args.preset
    delete args.preset

    if (preset && presets[preset]) {
        return presets[preset](args)
    } else {
        var contexts = splitByContext(args)
        var compilers = splitByEnv(contexts)
        return taskWrapper(compilers, selectTask(args))
    }
}
var attrHelp = 'There can be multiple (each a seperate argument), and they will contribute to the cross product of compilers'
var parser = parserFromArgumentMap({
    entry: {
        help: 'main entry point for your program, across all contexts'
    },
    out: {
        help: 'destination for compiled bundle'
    },
    modules: {
        help: 'where to look for modules'
    },
    watch: {
        help: 'monitor source files for changes and recompile.',
        action: 'storeTrue'
    },
    run: {
        help: 'Which context to run on compilation, if any'
    },
    env: {
        aliases: ['-e', '--environment'],
        dest: 'environments',
        help: 'an application lifecycle environment {DEVELOPMENT, PRODUCTION, etc} this distribution will run in. ' + attrHelp ,
        action: 'append'
    },
    context: {
        aliases: ['-c'],
        dest: 'contexts',
        help: 'a context {NODE, BROWSER, etc} this distribution will run in. ' + attrHelp ,
        action: 'append'
    },
    preset: {
        help: '\
            reference to a preset build configuration. For instance, FULLSTACK_COMPONENT references {\
            entry: ./src/entry.js\
            contexts: [NODE, BROWSER]\
            environments: [DEVELOPMENT, PRODUCTION]\
            out: ./dist/for/$context_$env.js\
        }. Presets are actually functions that take in the given user args, and thus can have fairly intricate logic.',
    },
    babelPreset: {
        dest: 'babelPresets',
        help: 'add a preset to the babel loader, between es2015 and stage-0',
        action: 'append'
    },
})

function configure(argstring){
    if(argstring){
        return applyPreset(parser.parseArgs(argstring.trim().split(/ +/)))
    } else {
        return applyPreset(parser.parseArgs())
    }
}
module.exports = configure
