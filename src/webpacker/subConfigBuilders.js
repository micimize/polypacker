import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'
import autoLoader from './autoLoader'

function babelLoader({babelPresets}){
    babelPresets.unshift('es2015')
    babelPresets.push('stage-0')
    return {
        test: /\.js|\.jsx$/,
        loader: 'babel',
        query: {
            presets: babelPresets.map(preset => `babel-preset-${preset}`)
        },
        exclude: /node_modules/,
        noParse: /\.min\.js/
    }
}

export function plugin({env, context, plugins}){
    return {
        plugins: [
        new webpack.DefinePlugin({
            $ES: {
                CONTEXT: JSON.stringify(context || 'NODE'),
                ENV: JSON.stringify(env)
            }
        }),
        new webpack.BannerPlugin(
            'require("source-map-support").install();',
            { raw: true, entryOnly: false }
        ),
        ...plugins,
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.NoErrorsPlugin(),
    ]}
}

export function target({context}){
    return {
        target: ({
            NODE: 'node',
            BROWSER: 'web'
        })[context]
    }
}

export function output(out){
    return {
        libraryTarget: "commonjs2",
        path: path.dirname(out),
        filename: path.basename(out),
    }
}

export function fixed() {
    return {
        devtool: 'source-map',
        cache: false,
        node: {
            __dirname: false,
            __filename: false
        },
        externals: [ nodeExternals() ]
    }
}

export function resolve({pwd, modules, dirname}) {
    let fallback = [
        path.join(dirname, "node_modules"),
        path.join(path.resolve(pwd), "node_modules"),
        path.join(path.resolve(pwd), "node_modules/polypacker/node_modules")
    ]
    return {
        context: path.resolve(pwd),
        resolve: {
            moduleDirectories: [modules, "node_modules", "node_modules/polypacker/node_modules"],
            extensions: ['', '.json', '.js', '.jsx'],
            fallback
        },
        resolveLoader: {
            moduleDirectories: ["node_modules", "polypacker/node_modules"],
            fallback
        },
    }
}

export function output({out}){
    return {
        output:  {
            libraryTarget: "commonjs2",
            path: path.dirname(out),
            filename: path.basename(out),
        }
    }
}

export function io({entry, out}){
    return {entry: [ entry ], ...output({out})}
}

export function module({babelPresets, packagePath = './package.json'}){
    return {
        module: {
            loaders: [
                babelLoader({babelPresets}), 
                ...autoLoader({jsonPath: path.resolve(packagePath)}),
            ]
        }
    }
}
