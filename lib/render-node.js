var h = require('lib/h')
var Thunk = require('vdom-thunk')

module.exports = function (node) {
  if (node && node() && node().node && node.context && node.context.nodeInfo) {
    var lookup = node.context.nodeInfo.lookup
    var info = lookup[node().node]

    if (info.render) {
      var args = []
      if (info.render.getInvalidationArgs) {
        args = info.render.getInvalidationArgs(node)
      }
      return Thunk(info.render, node, resolve(node), resolve(node.resolved), ...args)
    }
  }

  console.log('unknown node', node && node())
  return h('UnknownNode')
}

function resolve (val) {
  return typeof val === 'function' ? val() : val
}
