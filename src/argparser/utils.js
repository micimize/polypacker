
export function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor() || {}
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

export function selectTask({watch, run}){
    if(watch && run){
        return 'watch-and-run'
    } else if(watch){
        return 'watch'
    } else if (run) {
        return 'run'
    } else {
        return 'dist'
    }
}

export function taskWrapper(compilers, task, meta){
    return {
        task: task || 'dist', 
        compilers: compilers,
        meta: meta || {logLevel: compilers[0].logLevel || 'ERROR'}, 
    }
}

export function flatten(arrays){
    return [].concat.apply([], arrays);
}


export function splitByContext(args){
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

export function splitByEnv(args){
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
