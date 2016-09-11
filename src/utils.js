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

function objectsAreEqual(a, b) {
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
        return false;
    }

    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];

        // If values of same property are not equal,
        // objects are not equivalent
        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
}

function values(obj){
    return Object.keys(obj).map(k => obj[k])
}

export function uniquify(list){
    let objects = []
    return values(list.reduce((map, item) => {
        if(typeof(item) != 'object'){
            return Object.assign(map, {[item]: item})
        } else if(!objects.filter(o => objectsAreEqual(o, item)).length){
            objects.push(item)
            return Object.assign(map, {[item]: item})
        } else {
            return map
        }
    }, {}))
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
