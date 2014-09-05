var behave = require('dom-behavior')
var Remote = require('loop-drop-remote')

var behaviors = {
  'browser': require('./browser.js'),
  'editor': require('./editor.js')
}

module.exports = function(target){
  return behave(behaviors, target)
}