import readJsonSync from 'read-json-sync'

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

const cssLoaders = [ 'style-loader', 'css-loader' ]
const defaultLoaderMap = Object.assign(
    expandSimpleLoaderMap({
        json: 'json-loader',
        html: 'html-loader',
        css:  [ ...cssLoaders, 'postcss-loader'],
        less: [ ...cssLoaders, 'less-loader'   ],
        scss: [ ...cssLoaders, 'sass-loader'   ],
        sass: [ ...cssLoaders, 'sass-loader'   ] 
    }), {
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
function buildExpander(loaderSetMap){
    return function expandLoader(loaders, explicit){
        loaderSetMap[explicit] ?
            loaderSetMap[explicit].forEach(name => loaders = expandLoader(loaders, name)) :
            loaders[explicit + (explicit.endsWith('-loader') ? '' : '-loader')] = true
        return loaders
    }
}

function expandExplicitLoaders(explicitLoaders, loaderSetMap){
    return explicitLoaders.reduce(buildExpander(loaderSetMap), {})
}

export default function autoLoader({
    jsonPath = './package.json',
    loaderMap = defaultLoaderMap,
    loaderSetMap = defaultLoaderSetMap,
} = {}){
    let json = readJsonSync(jsonPath)

    let dependencyPool = Object.assign({}, json.dependencies, json.devDpendencies,
        expandExplicitLoaders(json.polypacker ? json.polypacker.loaders : [], loaderSetMap))
    return Object.keys(dependencyPool)
        .filter(name => name.endsWith('-loader'))
        .map(name => name.replace(/-loader$/,''))
        .map(name => loaderMap[name])
        .filter(name => name)
}
