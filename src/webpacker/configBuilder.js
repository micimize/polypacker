import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import modify from './modifiers'
import identity, { sign } from '../identity'
import { io, plugin, resolve, fixed, target, module } from './subConfigBuilders'

const derivedEnv = process.env.NODE_ENV && process.env.NODE_ENV.toUpperCase() || 'DEVELOPMENT'

export default function webpackConfig({
    entry, out, hot, modules, context,
    env=derivedEnv,
    babelPresets=[],
    plugins=[],
    [identity]: polypackMeta,
    overrides = {}
}){
    process.chdir(process.env.PWD)
    let config = Object.assign(
        polypackMeta ? {[identity]: polypackMeta} : sign({entry, out, hot, context, env}),
        io({entry, out}),
        target({context}),
        fixed(),
        plugin({env, context, plugins}),
        resolve({pwd: './', modules, dirname: path.join(__dirname, '..')}),
        module({babelPresets}),
        overrides
    )
    return modify({config, env, hot})
}
