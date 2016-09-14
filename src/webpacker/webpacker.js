import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import modify from './modifiers'
import identity, { sign } from '../identity'
import * as extend from '../extensible'
import * as defaultBuilders from './builders'
import merge from 'webpack-merge'

let builders = extend.byRequire({
    defaults: defaultBuilders,
    path: 'webpackConfiguration.builders'
})

function buildConfig(args){
    return merge.smart(...Object.values(builders).map(subConfigBuilder => subConfigBuilder(args)))
}

const derivedEnv = process.env.NODE_ENV && process.env.NODE_ENV.toUpperCase() || 'DEVELOPMENT'


export default function webpacker({
    entry, out, hot, bundle, modules, context,
    env=derivedEnv,
    babelPresets=[],
    plugins=[],
    [identity]: polypackMeta,
    overrides = {},
    ...args
}){
    process.chdir(process.env.PWD)

    let meta = polypackMeta ? {[identity]: polypackMeta} : sign({entry, out, hot, context, env})

    args = {
        entry, out, hot, bundle, modules, context, env, babelPresets, plugins,
        pwd: './', dirname: path.join(__dirname, '..'),
        ...args
    }

    let config = Object.assign( meta, merge.smart(buildConfig(args), overrides) )

    return modify({config, env, hot: meta[identity].hot, bundle})
}
