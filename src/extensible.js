import readJsonSync from 'read-json-sync'
import JSONPath from 'jsonpath-plus'
import path from 'path'
import { merge } from './utils'

function nestPaths({parents, child}){
  if(!parents.length){
    return child
  }
  child = `${parents.pop()}[(@['*']),${child}]`
  return nestPaths({parents, child})
}
function expandPath(path){
  let [anchor, root, ...parents] = path.split('.')
  let child = parents.pop()
  return nestPaths({parents: [`${anchor}.${root}`, ...parents], child})
}

const rootPath = process.env.CONFIGURATION_PATH || '$.polypacker'

function defaultResolver(modules){
  return Array.isArray(modules) ? modules : Object.keys(modules)
}

function resolve(json, {path, resolver = defaultResolver}){
  let modules = JSONPath({json, path/*: expandPath(path)*/, flatten: true})
  return resolver(modules)
}

function resolveSources({json, sources}){
  return merge(...sources.map(source => resolve(json, source)))
}

export default function extensible({
  defaults = [],
  handler = _ => _,
  merger = merge,
  resolver = _ => _,
  file = process.env.CONFIGURATION_FILE || './package.json',
  sources = [{path: rootPath}]
}){
  let json = readJsonSync(file)
  return merger(defaults, handler(resolveSources({json, sources})))
}

function localize(module){
  // I only think this is necessary when using npm link
  return path.join(process.env.PWD, module.startsWith('.') ? './' : './node_modules', module)
}
function subRequire({path}){
  let subModule = module => JSONPath({json: module, path, flatten: true})[0]
  return module => subModule($ES.requireExternal(process.env.POLYPACKER_LINKED ? localize(module) : module))
}

export function byLiteral({defaults, path, ...rest}){
  return extensible({
    defaults,
    ...rest,
    sources: [ {
      path: `$.polypacker.${path}`,
      resolver: _ => _[0]
    } ]
  })
}

export function byRequire({defaults, path, ...rest}){
  return extensible({
    defaults,
    ...rest,
    sources: [ {
      path: `$.polypacker.${path}`,
      resolver(modules){
        return defaultResolver(modules).map(subRequire({path}))
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
      resolver(modules){
        return (unpackContent ? unpackContentResolver : moduleToKeyResolver)(defaultResolver(modules))
      }
    } ]
  })
}

