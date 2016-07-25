import { ArgumentParser } from 'argparse'

export function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor() || {}
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

export function addArgumentMapToParser(parser, argumentMap){
    for (var key in argumentMap) {
        if (argumentMap.hasOwnProperty(key)) {
            var argAliases = argumentMap[key].aliases || []
            argAliases.unshift('--' + key)
            parser.addArgument(argAliases, argumentMap[key])
        }
    }
    return parser
}

export function parserFromArgumentMap(argumentMap){
    var parser = new ArgumentParser({
        argumentDefault: undefined,
        version: '0.0.1',
        addHelp: true,
        description: 'context-driven js distribution tool for multiple environments'
    })
    return addArgumentMapToParser(parser, argumentMap)
}

export function flatten(arrays){
    return [].concat.apply([], arrays);
}

export function uniquify(list){
    return Object.keys(list.reduce((map, item) => Object.assign(map, {[item]: true}), {}))
}

function mergeArrays(arrays){
    return uniquify(flatten(arrays))
}

function mergeObjects(objects){
    return Object.assign({}, ...objects)
}

export function merge(...args){
    return (Array.isArray(args[0])) ? mergeArrays(args) : mergeObjects(args)
}
