import nodeExternals from 'webpack-node-externals'
import webpack from 'webpack'

import polyPackerIdentity from '../identity'

const modifiers = {
    polypack: config => {
        let compound_version = config[polyPackerIdentity].signature
        config.externals.push(
            (context, request, callback) => {
            if(/^polypack!/.test(request))
                return callback(null, `${request.substr(9)}/dist/for/${compound_version}`);
            callback();
        })
        config.callbackLoader = {
            polypack: _ => `require("./for/${compound_version}") //polypacked by dist`
        }
        return config
    },
    hot: config => {
        config.debug = true
        config.plugins.unshift(new webpack.HotModuleReplacementPlugin())
        config.externals = [nodeExternals({ whitelist: ["webpack/hot/poll?1000"] })]
        config.plugins.unshift("webpack/hot/poll?1000")
        return config
    },
    production: config => {
        config.plugins.push( new webpack.optimize.UglifyJsPlugin() )
        return config
    }
}

export default function modify({config, env, hot}){
    config = modifiers.polypack(config)
    if(env.toLowerCase() == 'production')
        config = modifiers.production(config);
    if(hot)
        config = modifiers.hot(config);
    return config
}

