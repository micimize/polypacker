
export function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor() || {}
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

export function selectTask({task, watch, run}){
    if(task)
        return task;
    if(watch && run){
        return 'watch-and-run'
    } else if(watch){
        return 'watch'
    } else if (run) {
        return 'run'
    } else {
        return 'compile'
    }
}

export function flatten(arrays){
    return [].concat.apply([], arrays);
}

export function splitter({plural, singular}){
    return args => {
        if(Array.isArray(args)){
            return flatten(args.map(splitter({plural, singular})))
        }
        var vector = args[plural]
        delete args[plural]
        return vector && vector.length ? vector.map(function(element){
            var newArgs = clone(args)
            newArgs[singular] = element
            return newArgs
        }) : [args]
    }
}
