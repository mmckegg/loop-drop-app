var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')
var read = require('lib/read')
var AttributeHook = require('lib/attribute-hook')

module.exports = function(param, options){
  var value = read(param)

  if (value == null){
    value = options.defaultValue || false
  }

  var onValue = 'onValue' in options ? options.onValue : true
  var offValue = 'offValue' in options ? options.offValue : false

  var isOn = value == onValue
  var classes = []

  if (!options.custom) {
    classes.push('ToggleButton')
  }

  if (isOn) {
    classes.push('-active')
  }

  if (options.classList) {
    classes = classes.concat(options.classList)
  }

  return h('button', {
    className: classes.join(' '),
    title: options.description,
    'ev-click': send(setValue, {
      param: param,
      value: isOn ? offValue : onValue
    })
  }, isOn ? options.title : (options.offTitle || options.title) )
}

function setValue(ev){
  ev.param.set(ev.value)
}