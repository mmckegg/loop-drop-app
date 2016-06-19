var BaseEvent = require('value-event/base-event')
var Delegator = require('dom-delegator')
var DataSet = require('data-set')

var delegator = Delegator()
delegator.listenTo('dragstart')

module.exports = BaseEvent(function(ev, broadcast){
  var event = ev._rawEvent
  broadcast({
    data: this.data,
    dataTransfer: event.dataTransfer,
    preventDefault: event.preventDefault.bind(event)
  })
})
