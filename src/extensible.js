import readJsonSync from 'read-json-sync'
import JSONPath from 'jsonpath-plus'
import { merge } from './utils'

function resolve(json, {path, resolver=_=>_}){
    let modules = JSONPath({json, path, flatten: true})
    return resolver(Array.isArray(modules) ? modules : Object.keys(modules))
}

function resolveSources(json, sources){
    return merge(...sources.map(source => resolve(json, source)))
}

export default function extensible({
    defaults = [],
    handler = _ => _,
    merger = merge,
    resolver = _ => _,
    file = process.env.CONFIGURATION_FILE || './package.json',
    sources = [{path: process.env.CONFIGURATION_PATH || '$.polypacker'}]
}){
    let json = readJsonSync(file)
    return merger(defaults, handler(resolveSources(json, sources)))
}

export function byRequire({defaults, path, ...rest}){
    return extensible({
        defaults,
        ...rest,
        sources: [ {
            path: `$.polypacker.${path}`,
            resolver(modules){
                return modules.map(module => JSONPath({json: require(module), path, flatten: true})[0])
            }
        } ]
    })
}

export function byRequireMap({defaults, path, ...rest}){
    return extensible({
        defaults,
        ...rest,
        sources: [ {
            path: `$.polypacker.${path}`,
            resolver(modules){
                return modules.reduce((map, module) => {
                    map[module] = JSONPath({json: require(module), path, flatten: true})[0]
                    return map
                }, {})
            }
        } ]
    })
}
