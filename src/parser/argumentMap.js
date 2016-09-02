let attrHelp = 'There can be multiple (each a seperate argument), and they will contribute to the cross product of compilers'
const argumentMap = {
    entry: {
        help: 'main entry point for your program, across all contexts'
    },
    out: {
        help: 'destination for compiled bundle. If there are multiple, , and the destination of specific bundles will be decided by the --combinator'
    },
    outCombinator: {
        help: 'string to combine arguments that "define" a compiler (environment, environment)',
        defaultValue: '_',
    },
    outPrefix: {
        help: 'prefix for generated contextual modules. Appended to `out` directory',
    },
    modules: {
        help: 'where to look for modules',
    },
    watch: {
        help: 'monitor source files for changes and recompile.',
        action: 'storeTrue'
    },
    hot: {
        help: 'enable hot module replacement',
        action: 'storeTrue'
    },
    babelPreset: {
        dest: 'babelPresets',
        defaultValue: [],
        help: 'add a preset to the babel loader, between es2015 and stage-0',
        action: 'append'
    },

    env: {
        aliases: ['-e', '--environment'],
        dest: 'environments',
        help: 'an application lifecycle environment {DEVELOPMENT, PRODUCTION, etc} this distribution will run in. ' + attrHelp ,
        choices: ['DEVELOPMENT', 'PRODUCTION'],
        action: 'append'
    },
    context: {
        aliases: ['-c'],
        dest: 'contexts',
        help: 'a context {NODE, BROWSER, etc} this distribution will run in. ' + attrHelp ,
        choices: ['NODE', 'BROWSER'],
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

    task: {
        help: 'the task to run. If non is specified, it will be inferred from other arguments.'
    },
    run: {
        help: 'Which context to run on compilation, if any'
    },
    runner: {
        help: 'Which runner to run the selected compiler with, if any'
    },
    logLevel: {
        defaultValue: 'ERROR',
        choices: ['ERROR', 'VERBOSE', 'NONE'],
        help: 'VERBOSE will output webpack stats and warnings'
    }
}
export default argumentMap
