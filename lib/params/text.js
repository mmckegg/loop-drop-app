var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var ValueEvent = require('lib/value-event')
var read = require('lib/read')

module.exports = TextParam

function TextParam(param, options) {
  options = options || {}

  return h('input', {
    'type': 'text',
    'size': options.size,
    'placeholder': options.placeholder,
    'value': read(param), 
    'ev-change': ValueEvent(handleValue, 'value', param)
  })
}

function handleValue(value) {
  this.data.set(value)
}