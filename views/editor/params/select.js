var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var change = require('./value-event.js')
var read = require('./read.js')

module.exports = select

function select(param, opt){
  var value = read(param)
  var options = typeof opt.options == 'function' ? opt.options() : opt.options
  options = Array.isArray(options) ? options : []

  var optionElements = options.map(optionElement)

  if (value){
    var index = options.indexOf(value)
    if (!~index){
      var display = value
      if (opt.missingPrefix){
        display += opt.missingPrefix
      }
      optionElements.unshift(h('option', {value: value, selected: true}, display))
    } else {
      optionElements[index].properties.selected = true
    }
  }

  if (opt.includeBlank){
    var display = opt.includeBlank === true ? 'None' : opt.includeBlank
    optionElements.unshift(h('option', {value: ''}, display))
  }

  return h('div', {className: opt.flex ? '-flex' : null}, h('select', {
    'name': 'value', 'ev-change': change(param.set)
  }, optionElements))
}

function change(ev){
  ev.param.set(ev.value)
}

function optionElement(option){
  if (Array.isArray(option)){
    return h('option', {value: option[1]}, option[0])
  } else {
    return h('option', {value: option}, option)
  }
}