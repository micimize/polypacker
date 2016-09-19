#!/usr/bin/env node
require('babel-register')
require('babel-polyfill')

var polypacker = require('./src/index')
var taskManager = polypacker.taskManager
var argParser = polypacker.parser

if (require.main === module) {
  process.stdout._handle.setBlocking(true);
  process.stderr._handle.setBlocking(true);
  taskManager(argParser())
}

