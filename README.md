# Polypacker 
context-driven js distribution tool for multiple environments, built with webpack and gulp.  
This is used by [bufflehead](https://github.com/strictduck/bufflehead) and [strictduck](https://github.com/strictduck) as a unified way to distribute and load javascript bundles that runs in different contexts/environments.  
`npm install --save-dev polypacker`  

Polypacker is inspired by [meteor isobuild](https://www.meteor.com/isobuild) and initially started as a fork of [jlongster/backend-with-webpack](https://github.com/jlongster/backend-with-webpack).

## Overview
### distributing polypacks
Polypacker uses the webpack `DefinePlugin` to inject a global variable `$ES` into the code that currently has the structure:
```javascript
    $ES = {
        ENV: ('PRODUCTION' || 'DEVELOPMENT'),
        CONTEXT: ('NODE' || 'BROWSER')
    }
```
Then you can use it to base conditional requires off of in code, such as
```javascript
    let server = ($ES.CONTEXT == 'NODE') ?
        require('./server') :
        require('./representation')
```
  
When the code is run with the preset `FULLSTACK_COMPONENT`, a different bundle is generated for each combination:
```bash
> polypacker --preset FULLSTACK_COMPONENT

[23:59:16]   distributing from './src/index.js' to './dist/for/node_development.js'
[23:59:17]   distributing from './src/index.js' to './dist/for/node_production.js'
[23:59:17]   distributing from './src/index.js' to './dist/for/browser_development.js'
[23:59:17]   distributing from './src/index.js' to './dist/for/browser_production.js'
```
`polypacker` also writes `module.exports = polypack()` to `./dist/index.js`, which enables the polypack loader to locate the approriate bundle.

Usually you'll want to add this to your `package.json` in the form
```json
{ "scripts": { "dist": "polypacker --preset FULLSTACK_COMPONENT" } }
```
or for an actual application, the currently clumsy looking:
```json
{
  "scripts": {
    "dist":  "polypacker --preset NODE_APPLICATION --babelPreset react --env PRODUCTION --run false",
    "start": "polypacker --preset NODE_APPLICATION --babelPreset react --settings conf/settings.json"
  }
}
```
`--settings` is unknown to polypacker, and thus passed to the application through nodemon when it is `--run`.

### Using polypacks
Using polypacks from an application that is itself polypacked is quite straightforward:
```javascript
    import DDPouchDb from 'polypack!domain-driven-pouchdb-persistence-plugin'
```
From a normal `node.js` specific app that isn't polypacked, just reference the distribution directly (the above gets rewritten to this anyways):
```javascript
    import DDPouchDb from 'domain-driven-pouchdb-persistence-plugin/dist/for/node_production'
    // or for non es6, this time with dynamic import based on environment
    var DDPouchDb = require(
        'domain-driven-pouchdb-persistence-plugin/dist/for/node_' + \
        process.NODE_ENV.toLowerCase() || 'development' \
    ).default
```

### Technical details, presets
Under the covers, polypacker takes the various combinations of the `--context` and `--env` options, generates a webpack configuration for each, and then applies the appropriate compiler action (distribution or watching). A [`--preset`](https://github.com/michaeljosephrosenthal/polypacker/blob/master/src/argparser/presetMap.js) applies the given internal function to the cli arguments _before_ expanding them into the array of webpack configs.

So, for example [`polypacker --preset FULLSTACK_COMPONENT --watch`](https://github.com/michaeljosephrosenthal/polypacker/blob/master/src/argparser/presetMap.js#L35-L42) has the following forms before finally leaving the `argparser`:
```javascript
{ watch: true }
//=>
{
    watch: true,
    contexts: ['NODE', 'BROWSER'],
    environments: ['DEVELOPMENT', 'PRODUCTION']}`
}
//=>
[
    { watch: true, context: 'NODE',    env: 'DEVELOPMENT' },
    { watch: true, context: 'NODE',    env: 'PRODUCTION'  },
    { watch: true, context: 'BROWSER', env: 'DEVELOPMENT' },
    { watch: true, context: 'BROWSER', env: 'PRODUCTION'  }   
]
```  

## CLI Usage / Help
This is the current output of `node node_modules/.bin/polypacker --help`:
```
usage: polypacker [-h] [-v] [--entry ENTRY] [--out OUT] [--modules MODULES]
              [--watch] [--hot] [--run RUN] [--env ENVIRONMENTS]
              [--context CONTEXTS] [--preset PRESET]
              [--babelPreset BABELPRESETS] [--logLevel LOGLEVEL]


context-driven js distribution tool for multiple environments

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  --entry ENTRY         main entry point for your program, across all contexts
  --out OUT             destination for compiled bundle
  --modules MODULES     where to look for modules
  --watch               monitor source files for changes and recompile.
  --hot                 enable hot module replacement
  --run RUN             Which context to run on compilation, if any
  --env ENVIRONMENTS, -e ENVIRONMENTS, --environment ENVIRONMENTS
                        an application lifecycle environment {DEVELOPMENT,
                        PRODUCTION, etc} this distribution will run in. There
                        can be multiple (each a seperate argument), and they
                        will contribute to the cross product of compilers
  --context CONTEXTS, -c CONTEXTS
                        a context {NODE, BROWSER, etc} this distribution will
                        run in. There can be multiple (each a seperate
                        argument), and they will contribute to the cross
                        product of compilers
  --preset PRESET       reference to a preset build configuration. For
                        instance, FULLSTACK_COMPONENT references { entry: .
                        /src/entry.js contexts: [NODE, BROWSER] environments:
                        [DEVELOPMENT, PRODUCTION] out: .
                        /dist/for/$context_$env.js }. Presets are actually
                        functions that take in the given user args, and thus
                        can have fairly intricate logic.
  --babelPreset BABELPRESETS
                        add a preset to the babel loader, between es2015 and
                        stage-0
  --logLevel LOGLEVEL   VERBOSE will output webpack stats and warnings
```

### configuration
For customizing the webpack loaders, you can use the `polypacker.loaders` key in your `package.json`: 
```json
  "polypacker": { "loaders": ["general-asset"] }
```
This feature is still nasceant, and will allow for customization in the future. For now, the options are the following:
```javascript
const defaultLoaderSetMap = {
    'common-asset': ['woff', 'tff', 'eot', 'svg', 'png', 'jpg', 'png', 'eot', 'jpg'],
    'web-asset': ['common-asset', 'json', 'html', 'css'],
    'general-asset': ['web-asset', 'scss','less', 'sass', 'scss']
}
```
To use this feature, the dependent project has to depend on the appropriate [underlying webpack loaders](https://github.com/michaeljosephrosenthal/polypacker/blob/master/src/webpacker/autoLoader.js#L26-L54), such as `url-loader`, or `file-loader`. In the future, these will be either automatically installed by `polypacker`, or specified as dependencies such as `polypack-general-asset-loader` that will pull in the underlying webpack loaders.

