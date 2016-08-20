#!/usr/bin/env node
require('babel-register')
require('babel-polyfill')
var taskManager = require('./src/taskManager').default
var argParser = require('./src/parser').default

if (require.main === module) {
    process.stdout._handle.setBlocking(true);
    process.stderr._handle.setBlocking(true);
    taskManager(argParser())
}

