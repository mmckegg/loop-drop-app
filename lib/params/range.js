var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var read = require('lib/read')
var formatters = require('lib/format-params')
var MouseDragEvent = require('lib/mouse-drag-event')
var cancelEvent = require('lib/cancel-event')
var getValue = require('lib/get-value')

module.exports = range

function range(param, options){
  var defaultValue = options.defaultValue || 0
  var value = getValue(read(param), defaultValue)

  var formatter = formatters[options.format] || formatters.default
  var widthStyle = widthPercent(formatter.size(value))

  var classes = []

  if (options.large){
    classes.push('-large')
  }

  if (options.full){
    classes.push('-full')
  }

  if (options.flex){
    if (options.flex === 'small'){
      classes.push('-flexSmall')
    } else {
      classes.push('-flex')
    }
  }

  if (options.pull){
    classes.push('-pull')
  }

  var style = options.width ? {'width': options.width + 'px'} : {}
  var slider = h('div.slider', { 
    tabIndex: '0',
    'draggable': true,
    'ev-dragstart': cancelEvent(),
    'ev-mousedown': MouseDragEvent(drag, {
      param: param, 
      formatter: formatter, 
      defaultValue: defaultValue
    })
  },[ 
    h('div', {style: widthStyle}),
    h('span.value', formatter.display(value)),
    h('span.title', options.title)
  ])
  return h('RangeParam', {
    className: classes.join(' '),
    style: style
  }, slider)
}

function drag(ev){
  var param = this.data.param
  var formatter = this.data.formatter
  if (this.data.start){
    var start = this.data.start
    var range = this.data.range
    var offsetX = ev.x - start.x
    var offsetY = ev.y - start.y
    var offset = offsetX / (range + Math.abs(offsetY))
    var value = formatter.value(offset, this.data.startValue)
    value = getNewValue(read(param), value)
    param.set(value)
  } else if (ev.type === 'mousedown') {
    this.data.range = ev.currentTarget.getBoundingClientRect().width
    this.data.startValue = getValue(read(param), this.data.defaultValue)
    this.data.start = ev
  }
}

function widthPercent(decimal){
  return {
    width: (Math.round(Math.min(1, Math.max(decimal, 0))*1000)/10) + '%'
  }
}

function getNewValue(object, value){
  if (object instanceof Object && !Array.isArray(object)){
    var v = obtain(object)
    v.value = getNewValue(v.value, value)
    return v
  } else {
    return value
  }
}

function obtain(obj){
  return JSON.parse(JSON.stringify(obj))
}