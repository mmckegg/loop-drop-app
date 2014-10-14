var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var change = require('./value-event.js')
var read = require('./read.js')

module.exports = function(param){
  var widthSlider = h('div.slider')
  var heightSlider = h('div.slider')
  var value = read(param) || [1,1]

  return h('div Param -range', [
    h('input', {
      min: 1, max: 8,
      type: 'range',
      value: value[0],
      'ev-input': change(setArray, 'value', {param: param, value: value, index: 0})
    }),
    h('input', {
      type: 'range',
      min: 1, max: 8,
      value: value[1],
      'ev-input': change(setArray, 'value', {param: param, value: value, index: 1})
    }),
  ])
}

function setArray(value){
  var res = this.data.value.slice()
  res[this.data.index || 0] = parseInt(value) || 0
  this.data.param.set(res)
}