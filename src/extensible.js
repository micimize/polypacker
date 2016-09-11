import readJsonSync from 'read-json-sync'
import JSONPath from 'jsonpath-plus'
import { merge } from './utils'

function resolve(json, {path, resolver=_=>_}){
    return resolver(
        Object.keys(
            Object.assign({}, ...JSONPath({json, path, flatten: true}))))
}

function resolveSources(json, sources){
    return merge(...sources.map(source => resolve(json, source)))
}

export default function extensible({
    defaults = [],
    handler = _ => _,
    resolver = _ => _,
    file = './package.json',
    sources = [{path: '$.polypacker'}]
}){
    let json = readJsonSync(file)
    return merge(defaults, handler(resolveSources(json, sources)))
}

export function byRequire({defaults, path}){
    return extensible({
        defaults,
        sources: [ {
            path: `$.polypacker.${path}`,
            resolver(modules){
                return modules.map(module => JSONPath({json: require(module), path, flatten: true})[0])
            }
        } ]
    })
}
