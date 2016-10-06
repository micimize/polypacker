import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'
import loaders from './autoLoaders'

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
          ENV: JSON.stringify(env),
          requireExternal: "function(mod){ return require(mod) }"
        }
      }),
      ...plugins,
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.NoErrorsPlugin(),
    ]
  }
}

export function target({context}){
  return {
    target: ({
      NODE: 'node',
      BROWSER: 'web'
    })[context]
  }
}

export function fixed() {
  return {
    devtool: '#eval-cheap-source-map',
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
      moduleDirectories: ["node_modules", "node_modules/polypacker/node_modules"],
      fallback,
      alias: { polypack: 'callback?polypack' }
    },
  }
}

function output({out, context, chunkFileName}){
  let rest  = chunkFileName ? { chunkFileName } : {}
  if(context == 'NODE')
    rest.libraryTarget = "commonjs2";
  return {
    output:  {
      path: path.dirname(out),
      filename: path.basename(out),
      ...rest
    }
  }
}


export function io({entry, out, chunkFileName, context}){
  return {entry: [ entry ], ...output({out, context, chunkFileName})}
}


export function module({ babelPresets }){
  return {
    module: {
      loaders: [
        babelLoader({babelPresets}), 
        ...loaders,
      ]
    }
  }
}
