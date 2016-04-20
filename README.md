# Polypacker 
context-driven js distribution tool for multiple environments, built with webpack and gulp.  
This is used by [strictduck-bufflehead](https://github.com/strictduck/bufflehead) and related projects as a unified way to distribute and load javascript that runs in different contexts.  
`npm install --save-dev polypacker`  

#### author's note
This tool is now in a mildly stable beta, at least for [me](https://github.com/michaeljosephrosenthal) doing [what I'm doing](https://github.com/strictduck). If you're using it for another use case, or you have insights into how I'm mishandling environment variables or something, let me know! 

Polypacker is inspired by [meteor isobuild](https://www.meteor.com/isobuild) and borrows patterns and ideas heavily from [jlongster/backend-with-webpack](https://github.com/jlongster/backend-with-webpack).

## Overview
### distributing polypacks
Polypacker uses the webpack `DefinePlugin` to inject a global variable `$ES` into the code that generally has the structure:
```javascript
    $ES = {
        ENV: ('PRODUCTION' | 'DEVELOPMENT'),
        CONTEXT: ('NODE' | 'BROWSER'),
    }
```
Then you can use it to base conditional requires off of in code, such as
```javascript
    let server = ($ES.CONTEXT == 'NODE') ?
        require('./server') :
        require('./representation')
```
When the code is run with the preset `FULLSTACK_COMPONENT`
```bash
> polypacker --preset FULLSTACK_COMPONENT

[23:59:16]   distributing from './src/index.js' to './dist/for/node_development.js'
[23:59:17]   distributing from './src/index.js' to './dist/for/node_production.js'
[23:59:17]   distributing from './src/index.js' to './dist/for/browser_development.js'
[23:59:17]   distributing from './src/index.js' to './dist/for/browser_production.js'
```
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

## CLI Usage / Help
This is the current output of `node node_modules/polypacker/gulpfile.js --help`:
```
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
```
