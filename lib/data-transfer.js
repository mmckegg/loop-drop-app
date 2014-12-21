var BaseEvent = require('mercury').BaseEvent
var Delegator = require('mercury').Delegator
var DataSet = require('data-set')

var delegator = Delegator()
delegator.listenTo('dragstart')

module.exports = BaseEvent(function(ev, broadcast){
  var event = ev._rawEvent
  broadcast({
    data: this.data,
    dataTransfer: event.dataTransfer
  })
})