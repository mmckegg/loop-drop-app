var BaseEvent = require('mercury/node_modules/value-event/base-event')
var Delegator = require('mercury').Delegator
var DataSet = require('data-set')

var delegator = Delegator()
delegator.listenTo('dragstart')

module.exports = BaseEvent(function(ev){
  var event = ev._rawEvent
  return {
    data: this.data,
    dataTransfer: event.dataTransfer
  }
})