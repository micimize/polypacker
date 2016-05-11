#!/usr/bin/env node
require('babel-register')
require('babel-polyfill')
var taskManager = require('./taskManager').default
var argParser = require('./argparser').default

if (require.main === module) {
    taskManager(argParser())
}
