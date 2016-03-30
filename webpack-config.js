var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');
var XRegExp = require('xregexp');

module.exports = function(options){
    var server     = options.server,
        out        = options.out,
        modules    = options.modules,
        react    = options.react,
        es6Modules = options.es6Modules;
        context = options.context;
        includeNodeModules = options.includeNodeModules || [];
    process.chdir(process.env.PWD)
    var pwd = './'
    var config =  {
      devtool: 'source-map',
      externals: [ nodeExternals({ whitelist: includeNodeModules }) ],
      plugins: [
		new webpack.DefinePlugin({ $ES: { CONTEXT: JSON.stringify(context) || JSON.stringify('NODE'), ENV: JSON.stringify('PRODUCTION')} }),
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.BannerPlugin(
          'require("source-map-support").install();',
          { raw: true, entryOnly: false }
        ),
        new webpack.optimize.UglifyJsPlugin(),
		new webpack.NoErrorsPlugin(),
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
            test: /\.js|\.jsx$/,
            loaders: [ 'babel?presets[]=es2015' + (react ? '&presets[]=react' : '') + '&presets[]=stage-0'],
            exclude: es6Modules ? XRegExp('/node_modules\/(?!' + es6Modules + ')/') : /node_modules/,
            postLoaders: [
            ],
            noParse: /\.min\.js/
          }, {
            test: /\.json$/, loader: 'json'
          }, {
            test: /\.css$/, loader: 'style!css!postcss'
          }, {
            test: /\.less$/, loader: 'style!css!less'
          }, {
            test: /\.scss$/, loader: 'style-loader!css-loader!sass-loader?outputStyle=expanded&' + "includePaths[]=" + (path.resolve(process.cwd(), "./node_modules"))
          }, {
            test: /\.woff(2)?(\?.+)?$/, loader: "url?limit=10000&mimetype=application/font-woff" 
          }, {
            test: /\.ttf(\?.+)?$/, loader: "url?limit=10000&mimetype=application/octet-stream" 
          }, {
            test: /\.eot(\?.+)?$/, loader: "file" 
          }, {
            test: /\.svg(\?.+)?$/, loader: "url?limit=10000&mimetype=image/svg+xml"
          }, {
            test: /\.png$/, loader: "url-loader?limit=100000" 
          }, {
            test: /\.jpg$/, loader: "file-loader" 
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
		new webpack.DefinePlugin({ $ES: { CONTEXT: JSON.stringify(context) || JSON.stringify('NODE'), ENV: JSON.stringify('DEVELOPMENT')} }),
        new webpack.HotModuleReplacementPlugin(),
		new webpack.NoErrorsPlugin(),
        new webpack.BannerPlugin(
          'require("source-map-support").install();',
          { raw: true, entryOnly: false }
        )
      ]
      config.externals = [nodeExternals({ whitelist: ["webpack/hot/poll?1000"] })]
      config.entry = [ "webpack/hot/poll?1000", server ]
    }
    if(options.library){
        config.output.library = library
    }
    return config
}
