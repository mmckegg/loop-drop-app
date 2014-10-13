var BaseEvent = require('mercury/node_modules/value-event/base-event')
var Delegator = require('mercury').Delegator
var DataSet = require('data-set')

var delegator = Delegator()
delegator.listenTo('dragstart')
delegator.listenTo('dragend')
delegator.listenTo('dragover')
delegator.listenTo('dragenter')
delegator.listenTo('dragleave')
delegator.listenTo('drop')

module.exports = BaseEvent(function(ev){
  var event = ev._rawEvent
  var offset = getClientOffset(ev.currentTarget)
  return {
    x: event.clientX,
    y: event.clientY,
    offsetWidth: ev.currentTarget.offsetWidth,
    offsetHeight: ev.currentTarget.offsetHeight,
    offsetX: event.clientX - offset.x,
    offsetY: event.clientY - offset.y,
    dataTransfer: event.dataTransfer,
    currentTarget: event.currentTarget,
    event: ev,
    data: this.data
  }
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