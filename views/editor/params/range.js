var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

module.exports = range

function range(param, options){

  var slider = h('div')

  return h('div Param -range', {
    value: param(),
    'ev-change': mercury.valueEvent(param.set)
  })
}