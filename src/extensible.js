import readJsonSync from 'read-json-sync'
import path from 'path'
import { merge, flatten } from './utils'

function arrayify(val){
  return Array.isArray(val) ? val : (val !== undefined ? [val] : [])
}

function search({
  data,
  path: [node, ...path] = [undefined],
  star
}){
  // no data left
  if(data === undefined){
    return []
  }
  // search complete
  if(node === undefined){
    return arrayify(data)
  }
  if(node instanceof Object){
    let keyword = Object.keys(node)[0]
    if(keyword == 'allOf'){
      return flatten(node[keyword].map(
        child => search({ data, path: arrayify(child)})))
    }
  }
  // arrays can't have stars, just keep digging
  if(Array.isArray(data)){
    return search({ data: data[node], path })
  }
  if(data instanceof Object){
    ({ '*': star, [node]: data } = data)
    return [ ...arrayify(star), ...search({ data, path })]
  }
  // still searching, but out of searchable data
  return []
}

function nestPaths({parents, child}){
  if(!parents.length){
    return child
  }
  child = `${parents.pop()}[${child},'\`*']`
  return nestPaths({parents, child})
}
function expandPath(path){
  let [anchor, root, ...parents] = path.split('.')
  let child = parents.pop()
  return nestPaths({parents: [`${anchor}.${root}`, ...parents], child})
}

const rootPath = process.env.CONFIGURATION_PATH || ['polypacker']

function defaultResolver(modules){
  return Array.isArray(modules) ? modules : Object.keys(modules)
}

function resolve(data, {path, resolver = defaultResolver}){
  let modules = search({data, path})
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
  let subModule = module => search({data: module, path})[0]
  return module => subModule($ES.requireExternal(process.env.POLYPACKER_LINKED ? localize(module) : module))
}

export function byLiteral({defaults, path, ...rest}){
  return extensible({
    defaults,
    ...rest,
    sources: [ {
      path: ['polypacker', ...path],
      resolver: _ => _[0]
    } ]
  })
}

export function byRequire({defaults, path, ...rest}){
  return extensible({
    defaults,
    ...rest,
    sources: [ {
      path: ['polypacker', ...path],
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
      path: ['polypacker', ...arrayify(path)],
      resolver(modules){
        return (unpackContent ? unpackContentResolver : moduleToKeyResolver)(defaultResolver(modules))
      }
    } ]
  })
}

