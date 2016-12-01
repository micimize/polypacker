# Polypacker
### Universal javascript build and distribution tool built on top of webpack 
You might consider using polypacker over vanilla webpack if:
* You dislike the fork and forget boilerplate pattern
* You don't want to manage your own webpack configuration
* You're building a universal javascript application or component
   
Polypacker is inspired by [meteor isobuild](https://www.meteor.com/isobuild) and initially started as a fork of [jlongster/backend-with-webpack](https://github.com/jlongster/backend-with-webpack).
  
### Disclaimer
Polypacker is still experimental and incomplete. Some familiar webpack features are currently lacking (HMR for one) but the goal for the project is ultimately to have parity.
  
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
![example terminal output](https://cloud.githubusercontent.com/assets/8343799/20774555/793d7108-b71c-11e6-9fbd-c7295f459b99.png)
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
  
## Plugins
Polypacker aims to be extensible at every step of execution via plugin, allowing plugins to add CLI arguments, webpack configuration builders, and task runners. While this feature is still nasceant, you can take a look at the [simple test plugin](https://github.com/polypacker/simple-test-polypacker-plugin/blob/master/src/index.js) for a survey of the current extension points, and the [typescript plugin](https://github.com/polypacker/typescript-polypacker-plugin/blob/master/src/index.js) to see a realworld example.  
Plugins currently have to be referenced at each specific extension point in the `package.json` configuration, like so:
```json
  "polypacker": {
    "arguments": {
      "preset": "TYPESCRIPT"
    },
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
  
## Loaders
Depended-upon webpack loaders will automatically be loaded, as long as there is a matching configuration in the [preconfigured webpack loaders](https://github.com/michaeljosephrosenthal/polypacker/blob/master/src/webpacker/autoLoader.js#L26-L54) or [plugins](https://github.com/polypacker/simple-test-polypacker-plugin/blob/master/src/index.js#L32).
  
## CLI Usage / Help
The CLI is built with [jargon-parser](https://github.com/polypacker/jargon-parser), which is still nasceant. It is slightly inaccurate in that it thinks all array options are required, and doesn't have knowledge of the `preset` and `arguments` mechanisms.
```
./node_modules/.bin/polypacker --help

Usage: polypacker

context-driven js distribution tool for multiple environments

Arguments:

  --entry <string>                               [optional]        # main entry point for your program, across all contexts
  --out <string>                                 [optional]        # destination for compiled bundle. If there are multiple, the destination of specific bundles will be decided by
                                                                   the --combinator
  --watch <boolean>                              [optional]        # monitor source files for changes and recompile.
  --chunkFilename <string>                       [optional]        # If provided, enables code splitting with webpack.require. Examples patterns include  '[id].chunk.js',
                                                                   '[name].chunk.js'
  --babelPresets [ <string>, ...babelPresets ]   [required]        # add a preset to the babel loader, between es2015 and stage-0
  --outCombinator <string>                       [default: "_"]    # string to combine arguments that "define" a compiler (environment, environment)
  --outPrefix <string>                           [optional]        # prefix for generated contextual modules. Appended to `out` directory
  --modules <string>                             [optional]        # where to look for modules
  --environments [ <string>, ...environments ]   [required]        # an application lifecycle environment {DEVELOPMENT, PRODUCTION, etc} this distribution will run in
  --contexts [ <string>, ...contexts ]           [required]        # a context {NODE, BROWSER, etc} this distribution will run in.
  --task <string>                                [optional]        # the task to run. If non is specified, it will be inferred from other arguments.
  --run <string>                                 [optional]        # Which context to run on compilation, if any
  --runner <string>                              [optional]        # Which runner to run the selected compiler with, if any
  --logLevel <any>                               [default: ERROR]  # VERBOSE will output webpack stats and warnings
  --preset <string>                              [optional]        # module from which to import ALL of the potential presets (any missing presets will be identities)
```

