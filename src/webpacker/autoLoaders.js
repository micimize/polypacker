import extensible, * as extend from '../extensible'

function simpleTemplate({name, ...data}){
  return {
    test: new RegExp(`\.${name}$`,'g'), ...data
  }
}

function expandLoaderData(data){
  return (typeof(data) == 'string') ?
  {loader: data} :
  Array.isArray(data) ?
  {loaders: data} :
  data
}

export function expandSimpleLoaderMap(map){
  return Object.keys(map).reduce((newMap, name) => {
    let data = map[name]
    newMap[name] = simpleTemplate({name, ...expandLoaderData(map[name])})
    return newMap
  }, {})
}

const cssLoaders = [ 'style-loader', 'css-loader', 'postcss-loader' ]
const defaultLoaderMap = Object.assign(
  expandSimpleLoaderMap({
    json: 'json-loader',
    html: 'html-loader',
    css:  cssLoaders,
    less: [ ...cssLoaders, 'less-loader'   ],
  }), {
    sass: { test: /\.sass|\.scss$/, loader: "sass-loader" },
    woff: {
      test: /\.woff(2)?(\?.+)?$/,
      loader: "url-loader",
      query: "?limit=10000&mimetype=application/font-woff"
    },
    tff: {
      test: /\.ttf(\?.+)?$/,
      loader: "url-loader",
      query: "?limit=10000&mimetype=application/octet-stream"
    },
    svg: {
      test: /\.svg(\?.+)?$/,
      loader: "url-loader",
      query:"?limit=10000&mimetype=image/svg+xml"
    },
    png: { test: /\.png$/, loader: "url-loader", query: "?limit=100000" },
    eot: { test: /\.eot(\?.+)?$/, loader: "file-loader" },
    jpg: { test: /\.jpg$/, loader: "file-loader" }
  }
)

const defaultLoaderSetMap = {
  'common-asset': ['woff', 'tff', 'eot', 'svg', 'png', 'jpg', 'png', 'eot', 'jpg'],
  'web-asset': ['common-asset', 'json', 'html', 'css'],
  'general-asset': ['web-asset', 'scss','less', 'sass', 'scss']
}

function buildResolver(loaderSetMap){
  function resolveLoader(loaders, explicit){
    loaderSetMap[explicit] ?
      loaderSetMap[explicit].forEach(name => loaders = expandLoader(loaders, name)) :
      loaders.push(explicit + (explicit.endsWith('-loader') ? '' : '-loader'))
    return loaders
  }
  return function resolver(loaders){
    return loaders.reduce(resolveLoader, [])
  }
}

const suffixes = /-(loader|polypacker-plugin)$/

function stripSuffixes(str){
  return str.replace(suffixes, "") 
}

function stripKeySuffixes(map){
  return Object.keys(map).reduce((newMap, key) => {
    newMap[stripSuffixes(key)] = map[key]
    return newMap
  }, {})
}

export const loaderMap = extend.byRequireMap({
  handler: stripKeySuffixes,
  defaults: defaultLoaderMap,
  path: 'webpackConfiguration.moduleLoaders',
  options: { unpackContent: true }
})

export const loaderSetMap = extend.byRequireMap({
  handler: stripKeySuffixes,
  defaults: defaultLoaderSetMap,
  path: 'webpackConfiguration.moduleLoaderSets'
})

function handler(loaders){
  return loaders.filter(name => name.match(suffixes))
    .map(stripSuffixes)
    .map(name => loaderMap[name])
    .filter(loader => typeof(loader) == 'object')
}

export default extensible({
  handler,
  sources: [
    { path: '$.[dependencies,devDependencies]', resolver: sources => sources.reduce((arr, map) => [...arr, ...Object.keys(map)], [])}
  ]
})
