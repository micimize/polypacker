var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');
var XRegExp = require('xregexp');

module.exports = function(options){
    var server     = options.server,
        out        = options.out,
        modules    = options.modules,
        es6Modules = options.es6Modules;
    process.chdir(process.env.PWD)
    var pwd = './'
    var config =  {
      externals: [ nodeExternals() ],
      plugins: [
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.OccurenceOrderPlugin(),
        //new webpack.optimize.UglifyJsPlugin()
      ],
      target: 'node',
      cache:   false,
      node: {
        __dirname: true,
        __filename: true
      },
      context: path.resolve(pwd),
      resolve: {
        moduleDirectories: [modules, "node_modules"],
        extensions: ['', '.json', '.js', '.jsx']
      },
      module: {
        loaders: [
          {
            test: /\.js$/,
            loaders: [ 'babel?presets[]=stage-0,presets[]=es2015' ],
            exclude: es6Modules ? XRegExp('/node_modules\/(?!' + es6Modules + ')/') : /node_modules/,
          },
          {
              test: /\.json$/, loader: 'json'
          }
        ],
      },
      entry: [ server ],
      output: {
        libraryTarget: "commonjs2",
        path: path.dirname(out),
        filename: path.basename(out),
      },
    }
    if (process.env.NODE_ENV !== 'production' && options.task != 'dist'){
      config.devtool = 'source-map'
      config.debug = true
      config.plugins = [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
      ]
      config.externals = [nodeExternals({ whitelist: ["webpack/hot/poll?1000"] })]
      config.entry = [ "webpack/hot/poll?1000", server ]
    }
    if(options.library){
        config.output.library = library
    }
    return config
}
