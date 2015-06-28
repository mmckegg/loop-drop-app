#!/usr/bin/env node

var env = process.env
var child = require('child_process')
var spawn = require('child_process').spawn
var electron = require('electron-prebuilt')
var join = require('path').join

// last chance to use compiled add-ons before we switch to electron land!
if (!env.KEYBOARD) {
  // try and auto detect keyboard layout if not specified
  try {
    if (process.platform === 'linux') {
      if (child.execSync) {
        // some linux versions
        env.KEYBOARD = child.execSync("setxkbmap -print | awk -F\"+\" '/xkb_symbols/ {print $2}'", {encoding: 'utf8'})
      }
    } else {
      // mac + windows
      var KeyboardLayout = require('keyboard-layout')
      env['KEYBOARD'] = KeyboardLayout.getCurrentKeyboardLayout()
    }
  } catch (ex) {}
}

console.log('Keyboard:', env['KEYBOARD'] || 'unknown')

var app = spawn(electron, ['main.js'], { 
  stdio: 'inherit',
  env: env,
  cwd: join(__dirname, '..') 
}).on('exit', function(i, m) {
  process.exit()
})
