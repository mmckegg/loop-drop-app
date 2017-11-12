var h = require('lib/h')

module.exports = function (node) {
  // render whatever the node is when it is passed to the renderNode function
  var descriptor = node()
  if (node && node.context && node.context.nodeInfo && descriptor) {
    var lookup = node.context.nodeInfo.lookup
    var info = lookup[descriptor.node]
    if (info && info.render) {
      return info.render(node)
    } else {
      return h('UnknownNode')
    }
  }
}
