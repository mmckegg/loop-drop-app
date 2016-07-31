var h = require('lib/h')
var send = require('@mmckegg/mutant/send')

module.exports = function (node, display, options) {
  var collection = node.context.collection
  return h('header', options, [
    display,
    h('button.remove Button -warn', {
      'ev-click': send(collection.remove, node)
    }, 'X')
  ])
}
