#!/usr/bin/env node

var env = process.env
var spawn = require('child_process').spawn
var electron = require('electron-prebuilt')
var join = require('path').join

// last chance to use compiled add-ons before we switch to electron land!

if (!process.env.KEYBOARD) {
  // try and auto detect keyboard layout if not specified
  try {
    var KeyboardLayout = require('keyboard-layout')
    env['KEYBOARD'] = KeyboardLayout.getCurrentKeyboardLayout()
    console.log('Keyboard:', env['KEYBOARD'])
  } catch (ex) {}
}


var app = spawn(electron, ['main.js'], { 
  stdio: 'inherit',
  env: env,
  cwd: join(__dirname, '..') 
}).on('exit', function(i, m) {
  process.exit()
})