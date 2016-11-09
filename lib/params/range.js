var h = require('lib/h')
var send = require('@mmckegg/mutant/send')
var read = require('lib/read')
var computed = require('@mmckegg/mutant/computed')
var formatters = require('lib/format-params')
var MouseDragEvent = require('lib/mouse-drag-event')
var cancelEvent = require('lib/cancel-event')
var getValue = require('lib/get-value')

module.exports = range

function range (param, options) {
  var defaultValue = options.defaultValue || 0
  var formatter = formatters[options.format] || formatters.default

  var value = computed([param, defaultValue], function (value, defaultValue) {
    value = getValue(value)
    return value == null ? defaultValue : value
  })

  var widthStyle = computed([value], v => (Math.round(Math.min(1, Math.max(formatter.size(v), 0)) * 1000) / 10) + '%')
  var displayValue = computed([value], v => formatter.display(v))

  var classes = getClasses(options)
  var style = options.width ? {'flex-basis': options.width + 'px'} : {}

  var slider = h('div.slider', {
    tabIndex: '0',
    'draggable': true,
    'ev-dragstart': cancelEvent(),
    'ev-mousedown': MouseDragEvent(drag, {
      param: param,
      formatter: formatter,
      defaultValue: defaultValue
    }),
    'ev-dblclick': send(dblclickHandler, {
      param: param,
      defaultValue: defaultValue
    })
  }, [
    h('div', {style: { width: widthStyle }}),
    h('span.value', displayValue),
    h('span.title', options.title)
  ])

  return h('RangeParam', {
    className: classes.join(' '),
    style: style
  }, slider)
}

function getClasses (options) {
  var classes = []

  if (options.large) {
    classes.push('-large')
  }

  if (options.full) {
    classes.push('-full')
  }

  if (options.flex) {
    if (options.flex === 'small') {
      classes.push('-flexSmall')
    } else {
      classes.push('-flex')
    }
  }

  if (options.pull) {
    classes.push('-pull')
  }

  return classes
}

function dblclickHandler (obj) {
  var defaultValue = obj.defaultValue !== undefined
    ? obj.defaultValue
    : obj.param.defaultValue

  var value = getNewValue(read(obj.param), defaultValue)
  obj.param.set(value)
}

function drag (ev) {
  var param = this.data.param
  var formatter = this.data.formatter

  if (ev.type === 'mousedown') {
    this.data.range = ev.currentTarget.getBoundingClientRect().width
    this.data.startValue = getValue(read(param), this.data.defaultValue)
    this.data.start = ev
  } else {
    var range = this.data.range
    var offset = ev.offsetX / (range + Math.abs(ev.offsetY))
    var value = formatter.value(offset, this.data.startValue)
    value = getNewValue(read(param), value)
    if (read(param) !== value) {
      param.set(value)
    }
  }
}

function getNewValue (object, value) {
  if (object instanceof Object && !Array.isArray(object)) {
    var v = obtain(object)
    v.value = getNewValue(v.value, value)
    return v
  } else {
    return value
  }
}

function obtain (obj) {
  return JSON.parse(JSON.stringify(obj))
}
