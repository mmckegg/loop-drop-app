var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var formatters = require('../../../lib/format-params.js')
var MouseDragEvent = require('../../../lib/mouse-drag-event.js')

module.exports = range

function range(param, options){
  var formatter = formatters[options.format] || formatters.default
  var widthStyle = widthPercent(formatter.size(param()))
  var slider = h('div.slider', { 
    tabIndex: '0',
    'ev-mousedown': MouseDragEvent(drag, {param: param, formatter: formatter})
  },[ 
    h('div', {style: AttributeHook(widthStyle)}),
    h('span', formatter.display(param())),
    h('span.title', options.title)
  ])
  return h('div Param -range', {
    className: options.large ? '-large' : ''
  },[
    h('div', slider)
  ])
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
    //console.log(offsetX, offsetY, offset)
    var value = formatter.value(offset, this.data.startValue)
    param.set(value)
  } else if (ev.type === 'mousedown') {
    this.data.range = ev.currentTarget.getBoundingClientRect().width
    this.data.startValue = param()
    this.data.start = ev
  }
}

function widthPercent(decimal){
  return 'width:' + (Math.round(Math.min(1, Math.max(decimal, 0))*1000)/10) + '%'
}

function AttributeHook(value) {
  if (!(this instanceof AttributeHook)) {
    return new AttributeHook(value);
  }
  this.value = value;
}

AttributeHook.prototype.hook = function (node, prop, prev) {
  if (prev && prev.value === this.value) {
    return;
  }
  node.setAttributeNS(null, prop, this.value)
}