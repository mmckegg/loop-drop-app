var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var ValueEvent = require('lib/value-event')
var read = require('lib/read')

module.exports = select

function select(param, opt){
  var value = read(param)

  var options = typeof opt.options == 'function' ? opt.options() : opt.options
  options = Array.isArray(options) ? options : []
  var optionElements = options.map(optionElement)

  if (value){
    if (!markSelectedOption(optionElements, value)){
      var display = String(value)
      if (opt.missingPrefix){
        display += opt.missingPrefix
      }
      optionElements.unshift(h('option', {value: value, selected: true}, display))
    }
  }

  if (opt.includeBlank){
    var display = opt.includeBlank === true ? 'None' : opt.includeBlank
    optionElements.unshift(h('option', {value: ''}, display))
  }

  return h('div', {className: opt.flex ? '-flexSmall' : ''}, h('select', {
    'name': 'value', 'ev-change': ValueEvent(handleChange, 'value', param)
  }, optionElements))
}

function handleChange(value){
  this.data.set(value)
}

function optionElement(option){
  if (Array.isArray(option)){
    if (Array.isArray(option[1])){
      return h('optgroup', {
        label: option[0]
      }, option[1].map(optionElement))
    }
    return h('option', {value: option[1]}, option[0])
  } else {
    return h('option', {value: option}, option)
  }
}

function markSelectedOption(options, selectedValue){
  for (var i=0;i<options.length;i++){
    var option = options[i]
    if (option.properties && option.properties.value == selectedValue){
      option.properties.selected = true
      return true
    }
    if (option.children && option.children.length){
      var res = markSelectedOption(option.children, selectedValue)
      if (res){
        return true
      }
    }
  }
}