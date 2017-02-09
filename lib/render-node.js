var h = require('lib/h')
var computed = require('mutant/computed')

module.exports = function (node) {
  if (node && node.context && node.context.nodeInfo) {
    var lookup = node.context.nodeInfo.lookup
    var nodeType = computed([node], n => n.node)
    var nodeInfo = computed([nodeType], n => lookup[node().node])

    return computed([nodeInfo], function (info) {
      if (info && info.render) {
        return info.render(node)
      } else {
        return h('UnknownNode')
      }
    })
  }
}
