#!/usr/bin/env node
var path = require('path')
var exec = require('child_process').exec

process.chdir(path.join(__dirname, '..'))
var runner = exec('npm run start')
setTimeout(function(){
  runner.stdout.pipe(process.stdout)
  runner.stderr.pipe(process.stderr)
}, 1000)