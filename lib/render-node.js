var h = require('lib/h')

module.exports = function (node) {
  if (node && node() && node().node && node.context && node.context.nodeInfo) {
    var lookup = node.context.nodeInfo.lookup
    var info = lookup[node().node]

    if (info.render) {
      return info.render(node)
    }
  }

  console.log('unknown node', node && node())
  return h('UnknownNode')
}