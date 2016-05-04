#!/usr/bin/env node
var gulp = require('gulp');
var colors = require('colors');
var webpack = require('webpack');
var path = require('path');
var nodemon = require('nodemon');
var ON_DEATH = require('death')

var webpackConfig = require('./webpack-config');
var configure = require('./argparser');

function log(str){
    console.log(str)
}
function pad(num){
    return ("0"+num).slice(-2);
}
function shortTimestamp(){
    var d = new Date()
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + '.' + pad(d.getSeconds())
}
function prefix(){
    return colors.magenta('[' + shortTimestamp() + '] ') + colors.bgMagenta(' ') 
}

function importantLog(str){
  log( prefix() + " " + colors.bold(str))
}

// CONFIGURATION
var wrapper = configure()
var configurations = wrapper.config.compilers
var selectedTask = wrapper.config.task
var watching = {
    count: 0,
    compilers: []
}
function compoundVersion(options){
    var context = options.context,
        env     = options.env || process.env.NODE_ENV && process.env.NODE_ENV.toUpperCase() || 'DEVELOPMENT';
    return (context && env) ? context.toLowerCase() + '_' + env.toLowerCase() : 'index'
}

function onBuild(err, stats, configuration) {
    var compound_version = compoundVersion(configuration)
    if(err) {
      importantLog(colors(red('Errors while building ' + compound_version) + '!'))
      log('Error', err);
    } else {
        importantLog('successfully built ' + colors.cyan(compound_version))
    }
    if(wrapper.config.meta.logLevel == 'VERBOSE') {
      log(stats.toString({colors: true}));
    }     
}
function onFirstBuild(done) {
    return function(err, stats, configuration){
        onBuild(err,stats, configuration)
        done()
    }
}

function logImportantFromToAction(acting, configuration, color){
    color = color || 'cyan'
    importantLog(acting + " from '" + colors[color](configuration.entry) + "' to '" + colors[color](configuration.out) + "'")
}


function endWatch(watcher) {
    watcher.close(function(){
        logImportantFromToAction("stopped compiling", watcher._polypackConfiguration, 'magenta')
        watching.count -= 1
        if(!watching.count){
            importantLog('all watchers stopped. Polypacker exited cleanly')
            process.exit(0)
        }
    })
}


function compileForAllConfigurations(done){
  var firedDone = false
  configurations.map(function(configuration){
      logImportantFromToAction("distributing", configuration)
      webpack(webpackConfig(configuration)).run(function(err,stats){
          if(!firedDone) {
              firedDone = true
              onFirstBuild(done)(err, stats, configuration)
          } else {
              onBuild(err, stats, configuration)
          }
      })
  })
}

var contextWatchActions = {
    NODE: function(configuration){
        if(configuration.watch && configuration.run)
            nodemon.restart();
    }
}

function watchAllConfigurations(done){
  var firedDone = false;
  watching.compilers = configurations.map(function(configuration){
      logImportantFromToAction("watching and distributing", configuration)
      var watcher = webpack(webpackConfig(configuration)).watch(250, function(err, stats) {
          if(!firedDone) {
              firedDone = true;
              onFirstBuild(done)(err, stats, configuration)
          } else {
              onBuild(err, stats, configuration)
          }
          if(contextWatchActions[configuration.context]){
              contextWatchActions[configuration.context](configuration)
          }
      })
      watcher._polypackConfiguration = configuration
      watching.count += 1
      return watcher
  })
}


function runSelectedContext(){
  configurations.map(function(configuration){
      if(configuration.run){
          importantLog("runnning " + colors.cyan(configuration.context) + " context from " +  colors.cyan(configuration.out))
          nodemon({
              execMap: {
                  js: 'node'
              },
              script: path.join(process.env.PWD, configuration.out),
              args: wrapper.unknown,
              ignore: ['*'],
              watch: ['nothing/'],
              ext: 'noop'
          }).on('restart', function() {
              importantLog('Patched!')
          })
      }
  })
}

gulp.task('dist', compileForAllConfigurations)
gulp.task('watch', watchAllConfigurations)
gulp.task('run', ['dist'], runSelectedContext);
gulp.task('watch-and-run', ['watch'], runSelectedContext);

if (require.main === module) {
    gulp.start(selectedTask)
}

ON_DEATH(function(signal, err) {
    if(watching.count){
        log('\n')
        importantLog('stopping watchers.')
        watching.compilers.map(endWatch)
    } else {
        importantLog('Polypacker exited cleanly.')
    }
})
