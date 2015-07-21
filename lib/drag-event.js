var BaseEvent = require('value-event/base-event')
var Delegator = require('dom-delegator')

var delegator = Delegator()
delegator.listenTo('dragstart')
delegator.listenTo('dragend')
delegator.listenTo('dragover')
delegator.listenTo('dragenter')
delegator.listenTo('dragleave')
delegator.listenTo('drop')

module.exports = BaseEvent(function(ev, broadcast){
  var event = ev._rawEvent
  broadcast({
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,

    dataTransfer: event.dataTransfer,
    currentTarget: ev.currentTarget,

    preventDefault: ev.preventDefault,
    _rawEvent: event,

    data: this.data
  })
})