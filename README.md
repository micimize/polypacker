# Polypacker 
context-driven js distribution tool for multiple environments, built with webpack.  
You might consider using polypacker over vanilla webpack if:
* You dislike the fork and forget boilerplate pattern
* You don't want to manage your own webpack configuration
* You're building a universal javascript application or component
   

Polypacker is inspired by [meteor isobuild](https://www.meteor.com/isobuild) and initially started as a fork of [jlongster/backend-with-webpack](https://github.com/jlongster/backend-with-webpack).
  
## Quickstart
`npm install --save-dev polypacker`  
and add something like the following to your `package.json`:
```json
{
  "scripts": {
    "start": "polypacker --run NODE",
    "watch": "polypacker --watch",
    "dist": "polypacker --environments [ PRODUCTION ]"
  },
  "polypacker": {
    "arguments": {
      "preset": "FULLSTACK_APPLICATION",
      "babelPresets": [ "react" ]
    }
  }
}
```
`npm run watch` will build development versions for both `NODE` and the `BROWSER`, and automatically run the `NODE` context by default:
# img
It does this based on splitpoints in your code:
```javascript
    let server = ($ES.CONTEXT == 'NODE') ?
        require('./server') :
        require('./representation')
```
The global variable `$ES` (for ecmascript) that is injected with `DefinePlugin` currently has the structure:
```javascript
    $ES = {
        ENV: ('PRODUCTION' || 'DEVELOPMENT'),
        CONTEXT: ('NODE' || 'BROWSER')
    }
```
  
## Using polypacks
Polypacks are fullstack components distributed with `polypacker --preset FULLSTACK_COMPONENT`. Loading polypacks from an application that is itself polypacked is quite straightforward:
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
## Examples
* [fullstack react application with code splitting](https://github.com/polypacker/react-splitting-polypacker-example)
* [self-rendering react router component](https://github.com/polypacker/example-react-router-polypack)
  
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
### Plugins
```json
  "polypacker": {
    "parser": {
      "argumentSchema": "typescript-polypacker-plugin",
      "presets": "typescript-polypacker-plugin"
    },
    "webpackConfiguration": {
      "builders": "typescript-polypacker-plugin",
      "moduleLoaders": "typescript-polypacker-plugin"
    }
  }
```
  
## CLI Usage / Help
This is the current output of `node node_modules/.bin/polypacker --help`, written with [jargon-parser](https://github.com/polypacker/jargon-parser). It is currently very verbose:
```
Usage: polypacker
  --entry <string>                                   [optional]        # main entry point for your program, across all contexts
  --out <string>                                     [optional]        # destination for compiled bundle. If there are multiple, the destination of specific bundles will be
                                                                       decided by the --combinator
  --watch <boolean>                                  [optional]        # monitor source files for changes and recompile.
  --hot <boolean>                                    [optional]        # enable hot module replacement
  --chunkFilename <string>                           [optional]        # If provided, enables code splitting with webpack.require. Examples patterns include  '[id].chunk.js',
                                                                       '[name].chunk.js'
  --babelPresets [ <string>, ...babelPresets ]       [required]        # add a preset to the babel loader, between es2015 and stage-0
  --outCombinator <string>                           [default: "_"]    # string to combine arguments that "define" a compiler (environment, environment)
  --outPrefix <string>                               [optional]        # prefix for generated contextual modules. Appended to `out` directory
  --modules <string>                                 [optional]        # where to look for modules
  --environments [ <string>, ...environments ]       [required]        # an application lifecycle environment {DEVELOPMENT, PRODUCTION, etc} this distribution will run in
  --contexts [ <string>, ...contexts ]               [required]        # a context {NODE, BROWSER, etc} this distribution will run in.
  --task <string>                                    [optional]        # the task to run. If non is specified, it will be inferred from other arguments.
  --run <string>                                     [optional]        # Which context to run on compilation, if any
  --runner <string>                                  [optional]        # Which runner to run the selected compiler with, if any
  --logLevel <any>                                   [default: ERROR]  # VERBOSE will output webpack stats and warnings
  --compilers [                                                        # List of simple compiler definitions, in case there are little or no shared compiler arguments.
    [
      --entry <string>                               [optional]        # main entry point for your program, across all contexts
      --out <string>                                 [optional]        # destination for compiled bundle. If there are multiple, the destination of specific bundles will be
                                                                       decided by the --combinator
      --watch <boolean>                              [optional]        # monitor source files for changes and recompile.
      --hot <boolean>                                [optional]        # enable hot module replacement
      --chunkFilename <string>                       [optional]        # If provided, enables code splitting with webpack.require. Examples patterns include  '[id].chunk.js',
                                                                       '[name].chunk.js'
      --babelPresets [ <string>, ...babelPresets ]   [required]        # add a preset to the babel loader, between es2015 and stage-0
      --outCombinator <string>                       [default: "_"]    # string to combine arguments that "define" a compiler (environment, environment)
      --outPrefix <string>                           [optional]        # prefix for generated contextual modules. Appended to `out` directory
      --modules <string>                             [optional]        # where to look for modules
      --environment <string>                         [optional]        # an application lifecycle environment {DEVELOPMENT, PRODUCTION, etc} this distribution will run in.
      --context <string>                             [optional]        # a context {NODE, BROWSER, etc} this distribution will run in.
    ],
    ...compilers
  ]
  --compilerPreset <string>                          [optional]        # Preset for compiler arguments, both simple and cartesian, applied before any other process
  --managerPreset <string>                           [optional]        # Preset for manager arguments, applied after compilerPresets are run
  --argumentPreset <string>                          [optional]        # combination of managerPreset and compilerPreset, runs after both are completed. If the given module
                                                                       doesn't export an argumentPreset, it's compilerPreset and managerPresets will be used in succession instead.
  --compilerListPreset <string>                      [optional]        # Preset for the compiler list, applied after the list has been generated
  --postPreset <string>                              [optional]        # Preset applied after all parsing processes have run
  --preset <string>                                  [optional]        # module from which to import ALL of the potential presets (any missing presets will be identities)
```

