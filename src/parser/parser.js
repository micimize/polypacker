import applyPreset from './presets'
import postProcess from './postProcessor'
import schemaDrivenParser from 'jargon-parser'
import schema from './argumentSchema.json'

/*
import parserFromArgumentMap from './parserFromArgumentMap'
import argumentMap from './argumentMap'

const parser = parserFromArgumentMap(argumentMap)

export function parseArgs(argstring){
    let [config, unknown] = parser.parseKnownArgs(argstring && argstring.trim().split(/ +/))
    return { config, unknown }
}

// for testing the parser ad hoc
const parser = require('jargon-parser').default

const cli = parser({schema: __dirname + '/argumentSchema.json'})
console.log(JSON.stringify(cli().options))
*/

const parseArgs = schemaDrivenParser({ schema })

export default function parse(argstring){
    let {options, unknown} = parseArgs(argstring && argstring.trim().split(/ +/))
    return {
        config: postProcess(applyPreset(options)),
        unknown
    }
}
