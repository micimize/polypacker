import webpack from 'webpack'
import { resolve, normalize } from 'path'
import polyPackerIdentity from '../identity'

const modifiers = {
    polypack: config => {
        let compound_version = config[polyPackerIdentity].signature
        if(config.target == 'node'){
            config.externals.push(
                (context, request, callback) => {
                    if(/^polypack!/.test(request)){
                        return callback(null, `${request.substr(9)}/dist/for/${compound_version}`)
                    }
                    callback();
                }
            )
        }
        config.callbackLoader = {
            polypack: (mod) => mod ?
                `require("${mod}/dist/for/${compound_version}") //polypacked by dist` :
                `require("./for/${compound_version}") //polypacked by dist`
        }
        return config
    },
    hot: config => {
        config.plugins.unshift(new webpack.HotModuleReplacementPlugin())
        config.entry.unshift('webpack-hot-middleware/client')
        return config
    },
    production: config => {
        config.plugins.push( new webpack.optimize.UglifyJsPlugin() )
        return config
    },
    bundle: config => {
        let {
            output: {
                libraryTarget,
                publicPath,
                path,
                ...output
            }
        } = config
        publicPath = publicPath || `/${normalize(path)}/`
        path = resolve(path),
        config.output = { path, publicPath, ...output }
        config.node = {
            __dirname: true,
            fs: 'empty'
        }
        config.externals = []
        return config
    }
}

export default function modify({config, env, hot, bundle}){
    config = modifiers.polypack(config)
    if(env.toLowerCase() == 'production')
        config = modifiers.production(config);
    if(hot)
        config = modifiers.hot(config);
    if(bundle)
        config = modifiers.bundle(config);
    return config
}

