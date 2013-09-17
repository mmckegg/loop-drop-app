var h = require('hyperscript')
var extend = require('xtend')

module.exports = function(options){

  var element = h('input', extend(options, {type: 'range'}))

  return element

}