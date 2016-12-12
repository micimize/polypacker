import { resolve, normalize } from 'path'
import WebpackDevServer from 'webpack-dev-server'
import combineLoaders from 'webpack-dev-server'
import webpack from 'webpack'
import { cyan } from 'colors'
import webpackConfig from '../webpacker'
import { importantLog, logCompilation } from '../logging'

function collapse({loader, query}){
  return loader + "?" + JSON.stringify(query);
}

function addOverrides(configuration, {host, port}){
  let {
    output: {
      publicPath,
      filename = '[name]-[hash].js',
      libraryTarget,
      path,
      ...output
    }
  } = configuration
  publicPath = /*`http://${host}:${port}`*/ normalize(publicPath)
  path = resolve(path),
  configuration.output = { publicPath, filename, path, ...output }
  configuration.node = {
    __dirname: true,
    fs: 'empty'
  }
  configuration.plugins.unshift(new webpack.HotModuleReplacementPlugin())
  configuration.entry.unshift(`webpack-dev-server/client?http://${host}:${port}`, 'webpack/hot/dev-server')
  configuration.externals = []
  return configuration
}

const devServerRunner = {
  logRun({configuration: {context, out}}){
    importantLog(`serving ${cyan(context)} context from ${cyan(out)} with WebpackDevServer`)
  },
  run({configuration, args: {host='0.0.0.0', port=3000, ...args}}){
    this.logRun({configuration})
    this.config = addOverrides(webpackConfig(configuration), {host, port})
    this.compiler = webpack(this.config)
    this.server = new WebpackDevServer(this.compiler, {
      publicPath: this.config.output.publicPath,
      hot: true,
      inline: true,
      historyApiFallback: true,
      watchOptions: {poll: true},

      quiet: false,
      noInfo: false,
      stats: {
        // Config for minimal console.log mess.
        assets: false,
        colors: true,
        version: false,
        hash: false,
        timings: false,
        chunks: false,
        chunkModules: false
      }
    })
    this.server.listen(port, host, (err, result) => {
      //logCompilation()
      if (err) {
        console.log(err);
      }
      console.log(`Listening at ${this.config.output.publicPath}`);
    });
  }
}

export default devServerRunner
