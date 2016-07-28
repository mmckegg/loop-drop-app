var h = require('lib/h')
var send = require('@mmckegg/mutant/send')
var computed = require('@mmckegg/mutant/computed')
var Set = require('@mmckegg/mutant/set')
var resolve = require('@mmckegg/mutant/resolve')

module.exports = function (param, options) {
  var value = computed([param, options.defaultValue || false], function (value, defaultValue) {
    return value == null ? defaultValue : value
  })

  var onValue = 'onValue' in options ? options.onValue : true
  var offValue = 'offValue' in options ? options.offValue : false

  var caption = computed([value, options.title, options.offTitle], function (value, title, offTitle) {
    return value === onValue ? title : (offTitle || title)
  })

  var classList = Set(options.classList)

  if (!options.custom) {
    classList.add('ToggleButton')
  }

  classList.add(computed([value], function (value) {
    return value === onValue ? '-active' : null
  }))

  return h('button', {
    classList: classList,
    title: options.description,
    'ev-click': send(toggleValue, {
      param: param,
      onValue: onValue,
      offValue: offValue,
      value: value
    })
  }, caption)
}

function toggleValue (ev) {
  if (resolve(ev.value) !== ev.onValue) {
    ev.param.set(resolve(ev.onValue))
  } else {
    ev.param.set(resolve(ev.offValue))
  }
}
