var h = require('lib/h')
var send = require('@mmckegg/mutant/send')
var computed = require('@mmckegg/mutant/computed')

module.exports = function renderExternal (node) {
  var lookup = node.context.nodeInfo.lookup
  return computed(node.nodeName, function (nodeName) {
    var info = lookup[nodeName]
    if (info && info.renderExternal) {
      return info.renderExternal(node)
    } else {
      var data = node()
      var collection = node.context.collection
      return h('div ExternalNode', {
        style: {
          border: '2px solid transparent'
        }
      },
       [
        h('header', [
          h('span', data.id + ' (external)'),
          h('button.remove Button -warn', {
            'ev-click': send(collection.remove, node)
          }, 'X')
        ])
      ])
    }
  })
}
