#!/usr/bin/env node

var spawn = require('child_process').spawn
var electron = require('electron')
var join = require('path').join

var app = spawn(electron, ['main.js'], {
  stdio: 'inherit',
  cwd: join(__dirname, '..')
}).on('exit', function(i, m) {
  process.exit()
})
