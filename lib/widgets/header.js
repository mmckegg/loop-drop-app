var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')

module.exports = function(node, display, options){
  var collection = node.context.collection

  return h('header', options, [
    display,
    h('button.remove Button -warn', {
      'ev-click': send(collection.remove, node),
    }, 'X')
  ])
}