var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var read = require('lib/read')

module.exports = function(param, options){
  var value = read(param)

  if (value == null){
    value = options.defaultValue || false
  }

  var onValue = 'onValue' in options ? options.onValue : true
  var offValue = 'offValue' in options ? options.offValue : false

  var isOn = value == onValue
  var classes = []

  if (isOn) {
    classes.push('-active')
  }

  if (options.classList) {
    classes = classes.concat(options.classList)
  }

  return h('button ToggleButton', {
    className: classes.join(' '),
    'ev-click': mercury.event(setValue, {
      param: param,
      value: isOn ? offValue : onValue
    })
  }, isOn ? options.title : (options.offTitle || options.title) )
}

function setValue(ev){
  ev.param.set(ev.value)
}