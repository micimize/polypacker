import { ArgumentParser } from 'argparse'
import argumentMap from './argumentMap'

export function addArgumentMapToParser(parser, argumentMap){
    let args = Object.keys(argumentMap).reduce((clone, key) => (
       Object.assign(clone, {[key]: Object.assign({}, argumentMap[key])})), {})
    for (var key in args) {
        if (args.hasOwnProperty(key)) {
            var argAliases = args[key].aliases || []
            argAliases.unshift('--' + key)
            parser.addArgument(argAliases, args[key])
        }
    }
    return parser
}

export default function parserFromArgumentMap(argumentMap){
    var parser = new ArgumentParser({
        argumentDefault: undefined,
        version: '0.0.1',
        addHelp: true,
        description: 'context-driven js distribution tool for multiple environments'
    })
    return addArgumentMapToParser(parser, argumentMap)
}

