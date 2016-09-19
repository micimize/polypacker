import fs from 'fs'
import { devServerRunner } from '../runners'
import BundleTracker from 'webpack-bundle-tracker'

function fromSrcDir(args){
    args.entry = args.entry || './src/index.js'
    args.modules = args.modules || './src'
    return args
}

function defaultContextualComponent(args){
    args = fromSrcDir(args)
    args.out = args.out || args.context &&
        './dist/for/' + args.context.toLowerCase() + '_' + args.env.toLowerCase() + '.js'
    return args
}

function handleIndexTemplate(){
    try {
        fs.lstatSync('./dist/index.js')
    } catch(err){
        fs.mkdir('./dist')
        fs.createReadStream(__dirname + '/templates/fullstackComponentIndex.js')
            .pipe(fs.createWriteStream('./dist/index.js'))
    }
}

export function FULLSTACK_COMPONENT(args){
    handleIndexTemplate() // TODO: this and splitByContext don't handle args.out like they should

    args.contexts = ['NODE', 'BROWSER']
    args.environments = ['DEVELOPMENT', 'PRODUCTION']
    args.outPrefix = './dist/for/' 
    args = fromSrcDir(args)
    return args
}

export function NODE_APPLICATION(args){
    args.contexts = ['NODE']
    args.out = args.out || './dist/index.js'
    args.run = true
    args = fromSrcDir(args)
    return args
}

export function STANDALONE_BROWSER_APPLICATION(args){
    args.bundle = true
    args.runner = devServerRunner

    args.contexts = ['BROWSER']
    args.run = args.watch && args.contexts.length
    args.hot = args.hot || args.watch
    args.out = args.out || './dist/index.js'
    args = fromSrcDir(args)
    return args
}

export function DJANGO_REACT(args){
    args.plugins = [new BundleTracker({filename: './webpack-stats.json'})]

    args.babelPresets = ['react']
    return STANDALONE_BROWSER_APPLICATION(args)
}

export function FULLSTACK_APPLICATION(args){
    args.contexts = ['NODE', 'BROWSER']
    args.run = (args.watch || args.run) && 'NODE'
    args.out = './dist/' 
    args = fromSrcDir(args)
    return args
}
