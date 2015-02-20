var BaseEvent = require('mercury').BaseEvent
var Delegator = require('mercury').Delegator
var DataSet = require('data-set')

var delegator = Delegator()
delegator.listenTo('dragstart')
delegator.listenTo('dragend')
delegator.listenTo('dragover')
delegator.listenTo('dragenter')
delegator.listenTo('dragleave')
delegator.listenTo('drop')

module.exports = BaseEvent(function(ev, broadcast){
  var event = ev._rawEvent
  var offset = getClientOffset(ev.currentTarget)
  broadcast({
    x: event.clientX,
    y: event.clientY,
    offsetWidth: ev.currentTarget.offsetWidth,
    offsetHeight: ev.currentTarget.offsetHeight,
    offsetX: event.clientX - offset.x,
    offsetY: event.clientY - offset.y,
    dataTransfer: event.dataTransfer,
    currentTarget: ev.currentTarget,

    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,

    event: ev,
    target: event.target,
    data: this.data
  })
})

function getClientOffset(element){
  var pos = {x: 0, y: 0};
  while ( element ) {
    pos.x += element.offsetLeft
    pos.y += element.offsetTop
    element = element.offsetParent
  }
  return pos
}