var ArgumentParser = require('argparse').ArgumentParser

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
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

function splitByContext(args){
    var contextuallyDividedArgs = []
    for (var context in args.contexts) {
        contextArgs = clone(args)
        contextArgs.context = context
        delete contextArgs.contexts
        contextuallyDividedArgs.push(resolvePresets(contextArgs))
    }
    return contextuallyDividedArgs
}
function fromSrcDir(args){
    args.entry = args.entry || './src/index.js'
    args.modules = args.modules || './src'
    return args
}

function defaultContextualComponent(args){
    args = fromSrcDir(args)
    args.out = args.out || args.context && './dist/for/' + args.context.toLowerCase() + '.js'

    return args
}

var presets = {
    NODE_COMPONENT: function(args){ return [defaultContextualComponent(args)],
    BROWSER_COMPONENT: function(args){ return [defaultContextualComponent(args)],
    FULLSTACK_COMPONENT: function(args){
        var contexts = splitByContext(args)
        for (i = 0; i < contexts.length; i++) {
            contexts[i] = defaultContextualComponent(contexts[i])
        }
        return contexts
    },
    FULLSTACK_APPLICATION: function(args){
        var contexts = splitByContext(args)
        for (i = 0; i < contexts.length; i++) {
            contexts[i] = defaultContextualComponent(contexts[i])
            contexts[i] = ( contexts[i].context == 'NODE' )
        }
        return contexts
    }
}

function applyPreset(args){
    var preset = args.preset
    delete args.preset

    if (preset && presets[preset]) {
        return presets[preset](args)
    } else {
        return args
    }
}

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
        help: 'monitor source files for changes and recompile.'
    },
    run: {
        help: 'Which context to run on compilation, if any'
    },
    context: {
        aliases: ['-c'],
        dest: 'contexts',
        help: 'a context this distribution will run in. There can be multiple, and they will be split into seperate compilers',
        action: 'append'
    },
    preset: {
        help: '\
            reference to a preset build configuration. For instance, FULLSTACK_COMPONENT references {\
            entry: ./src/entry.js\
            contexts: [NODE, BROWSER]\
            out: ./dist/for/$context.js\
        }. Presets are actually functions that take in the given user args, and thus can have fairly intricate logic.',
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
