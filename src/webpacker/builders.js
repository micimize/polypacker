import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'
import loaders from './autoLoaders'

function babelLoader({babelPresets}){
  return {
    test: /\.js|\.jsx$/,
    loader: 'babel',
    query: {
      presets: ['es2015', ...babelPresets, 'stage-0'].map(preset => `babel-preset-${preset}`)
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
      ...(context == 'NODE' ?
        [new webpack.BannerPlugin('require("source-map-support").install();', { raw: true, entryOnly: false })] :
        [])
    ]
  }
}

export function target({context}){
  if(context == 'NODE'){
    return {
      target: 'node',
      externals: [ nodeExternals() ]
    }
  }
  else if (context == 'BROWSER'){
    return { target: 'web' }
  }
}

export function fixed() {
  return {
    devtool: '#source-map',
    node: {
      __dirname: false,
      __filename: false
    }
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

function output({out, context, chunkFilename, publicPath: explicitPublicPath }){
  let filename = path.basename(out)
  let rest = {}
  if(chunkFilename)
    rest = {
      chunkFilename: `${path.parse(filename).name}.${chunkFilename}`,
      publicPath: (explicitPublicPath || `/${path.dirname(path.normalize(out))}/`)
    }
  if(context == 'NODE')
    rest.libraryTarget = "commonjs2";
  return {
    output:  {
      path: path.dirname(out),
      filename,
      ...rest
    }
  }
}


export function io({entry, out, chunkFilename, context}){
  return {entry: [ entry ], ...output({out, context, chunkFilename})}
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
