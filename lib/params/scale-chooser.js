var h = require('micro-css/h')(require('virtual-dom/h'))
var read = require('lib/read')
var MouseDragEvent = require('lib/mouse-drag-event')

module.exports = ScaleChooser

function ScaleChooser(param){
  var value = getValue(read(param))
  
  var buttons = []
  for (var i=0;i<12;i++){
    var button = h('div.button', {
      tabIndex: '0', 
      className: ~value.indexOf(i) ? '-selected' : '',
      'ev-mousedown': MouseDragEvent(handleDrag, { param: param, id: i })
    })
    buttons.push(button)
  }
  return h('ScaleChooser', buttons)
}

function handleClick(target){
  var value = getValue(read(target.param))
  var index = value.indexOf(target.id)
  value = value.slice()

  if (~index){
    value.splice(index, 1)
  } else {
    value.push(target.id)
    value.sort(compare)
  }

  target.param.set(value)
}

function handleDrag(ev) {
  var param = this.data.param
  if (ev.type === 'mousemove' && this.data.start) {
    var start = this.data.start
    var offset = Math.round(ev.offsetX / ev.target.clientWidth)
    if (offset !== this.data.lastOffset) {
      this.data.lastOffset = offset
      this.data.dragged = true
      param.set(this.data.start.map(function(x) {
        return mod(x + offset, 12)
      }).sort(compare))
    }
  } else if (ev.type === 'mousedown') {
    this.data.start = read(param)
    this.data.lastOffset = 0
  } else if (ev.type === 'mouseup' && !this.data.dragged) {
    handleClick(this.data)
  }
}

function mod(n, m) {
  return ((n%m)+m)%m
}

function compare(a,b){
  return a - b
}

function getValue(source){
  return Array.isArray(source) ? source : [0,1,2,3,4,5,6,7,8,9,10,11]
}