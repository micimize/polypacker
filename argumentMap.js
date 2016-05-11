let attrHelp = 'There can be multiple (each a seperate argument), and they will contribute to the cross product of compilers'
const argumentMap = {
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
    hot: {
        help: 'enable hot module replacement',
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
        defaultValue: [],
        help: 'add a preset to the babel loader, between es2015 and stage-0',
        action: 'append'
    },
    logLevel: {
        defaultValue: 'ERROR',
        help: 'VERBOSE will output webpack stats and warnings'
    }
}
export default argumentMap
