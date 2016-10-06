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

function subRequire({path}){
  let subModule = module => JSONPath({json: module, path, flatten: true})[0]
  return module => subModule($ES.requireExternal(module))
}

export function byRequire({defaults, path, ...rest}){
  return extensible({
    defaults,
    ...rest,
    sources: [ {
      path: `$.polypacker.${path}`,
      resolver(modules){
        return modules.map(subRequire({path}))
      }
    } ]
  })
}

export function byRequireMap({ defaults, path, ...rest, options: { unpackContent = false, ...options } = {} }){

  let subResolver = subRequire({path})

  function moduleToKeyResolver(modules){
    return modules.reduce((map, module) => {
      map[module] = subResolver(module)
      return map
    }, {})
  }

  function unpackContentResolver(modules){
    return modules.reduce((map, module) => {
      Object.assign(map, subResolver(module))
      return map
    }, {})
  }

  return extensible({
    defaults,
    ...rest,
    sources: [ {
      path: `$.polypacker.${path}`,
      resolver: unpackContent ? unpackContentResolver : moduleToKeyResolver
    } ]
  })
}

