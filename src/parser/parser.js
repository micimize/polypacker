import parserFromArgumentMap from './parserFromArgumentMap'
import argumentMap from './argumentMap'
import applyPreset from './presets'
import postProcess from './postProcessor'

const parser = parserFromArgumentMap(argumentMap)

export function parseArgs(argstring){
    let [config, unknown] = parser.parseKnownArgs(argstring && argstring.trim().split(/ +/))
    return { config, unknown }
}

export default function parse(argstring){
    let {config, unknown} = parseArgs(argstring)
    return {
        config: postProcess(applyPreset(config)),
        unknown
    }
}
