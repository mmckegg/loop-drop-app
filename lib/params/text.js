var h = require('lib/h')
var DomEvent = require('lib/dom-event')

module.exports = TextParam

function TextParam (param, options) {
  options = options || {}

  return h('input', {
    'type': 'text',
    'size': options.size,
    'placeholder': options.placeholder,
    'value': param,
    'ev-change': DomEvent(handle, param)
  })
}

function handle (event) {
  this.data.set(event.currentTarget.value)
}
