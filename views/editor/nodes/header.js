var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

module.exports = function(node, display, options){
  var collection = node.context.collection

  return h('header', options, [
    display,
    h('button.remove Button -warn', {
      'ev-click': mercury.event(collection.remove, node),
    }, 'X')
  ])
}