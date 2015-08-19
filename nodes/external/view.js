var h = require('lib/h')
var send = require('value-event/event')

module.exports = function renderExternal (node) {
  if (node.resolved() && node.resolved().node && node.context && node.context.nodeInfo) {
    var lookup = node.context.nodeInfo.lookup
    var info = lookup[node.resolved().node]

    if (info.renderExternal) {
      return info.renderExternal(node)
    }
  }

  var data = node()
  var collection = node.context.collection

  return h('div ExternalNode', [
    h('header',[
      h('span', data.id + ' (external)'),
      h('button.remove Button -warn', {
        'ev-click': send(collection.remove, node),
      }, 'X')
    ])
  ])
}