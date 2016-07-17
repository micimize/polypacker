import { resolve, normalize } from 'path'
import WebpackDevServer from 'webpack-dev-server'
import webpack from 'webpack'
import { cyan } from 'colors'
import webpackConfig from '../webpacker'
import { importantLog } from '../logging'

function addOverrides(configuration, {host, port}){
    let {
        output: {
            publicPath,
            libraryTarget,
            path,
            ...output
        }
    } = configuration
    publicPath = `http://${host}:${port}${normalize(publicPath)}`
    path = resolve(path),
    configuration.output = { publicPath, path, ...output }
    configuration.node = {
        __dirname: true,
        fs: 'empty'
    }
    configuration.externals = []
    return configuration
}

const devServerRunner = {
    logRun({configuration: {context, out}}){
        importantLog(`serving ${cyan(context)} context from ${cyan(out)} with WebpackDevServer`)
    },
    run({configuration, args: {host='0.0.0.0', port=3000, ...args}}){
        console.log(args)
        this.logRun({configuration})
        this.config = addOverrides(webpackConfig(configuration), {host, port})
        this.compiler = webpack(this.config)
        this.server = new WebpackDevServer(this.compiler, {
            publicPath: this.config.output.publicPath,
            hot: true,
            inline: true,
            historyApiFallback: true
        })
        this.server.listen(port, host, (err, result) => {
            if (err) {
                console.log(err);
            }
            console.log(`Listening at ${this.config.output.publicPath}`);
        });
    }
}

export default devServerRunner
