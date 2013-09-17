var h = require('hyperscript')
var extend = require('xtend')

module.exports = function(options){

  var element = h('select', options, 
    h('option', {value: 'oneshot'}, 'One Shot'),
    h('option', {value: 'hold'}, 'Hold'),
    h('option', {value: 'loop'}, 'Loop (hold)')
  )

  return element

}