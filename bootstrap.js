#!/usr/bin/env node
require('babel-register')
require('babel-polyfill')
var taskManager = require('./src/taskManager').default
var argParser = require('./src/argparser').default

if (require.main === module) {
    taskManager(argParser())
}
