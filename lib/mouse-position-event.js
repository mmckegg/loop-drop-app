var BaseEvent = require('value-event/base-event')
var Delegator = require('dom-delegator')
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
  var box = ev.currentTarget.getBoundingClientRect()
  broadcast({
    x: event.clientX,
    y: event.clientY,
    offsetWidth: ev.currentTarget.offsetWidth,
    offsetHeight: ev.currentTarget.offsetHeight,
    offsetX: event.clientX - box.left,
    offsetY: event.clientY - box.top,
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