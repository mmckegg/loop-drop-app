module.exports = resolveNode

function resolveNode (nodes, nodeName) {
  if (!nodeName) {
    return null
  }

  // quick lookup
  if (nodes[nodeName]) {
    return nodes[nodeName]
  }

  // walkies
  var node = nodes || {}
  while (nodeName && node) {
    var index = nodeName.indexOf('/')
    if (index < 0) {
      node = node[nodeName]
      nodeName = null
    } else {
      var key = nodeName.slice(0, index)
      nodeName = nodeName.slice(index + 1)
      node = node[key]
    }
  }
  return node
}
