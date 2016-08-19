module.exports = function setRoute (node, id, value) {
  if (node.routes) {
    node.routes.put(id, value)
  } else if (node.node && node.node.routes) {
    node.node.routes.put(id, value)
  }
}
