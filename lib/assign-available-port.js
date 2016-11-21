module.exports = assignAvailablePort

function assignAvailablePort (node) {
  var nodeInfo = node.context.nodeInfo.lookup[node().node]
  if (nodeInfo && node.port && nodeInfo.portMatch) {
    if (!node.port() || !nodeInfo.portMatch.exec(node.port())) {
      var availablePorts = node.context.midiPorts().filter(function (name) {
        return nodeInfo.portMatch.exec(name)
      })

      var usedPorts = []
      node.context.collection.forEach(function (controller) {
        if (controller) {
          var name = controller.port && controller.port()
          if (availablePorts.includes(name)) {
            usedPorts.push(name)
          }
        }
      })

      var portName = getRarest(availablePorts.concat(usedPorts))
      node.port.set(portName)
    }
  }
}

function getRarest (array) {
  var ranked = array.reduce(function (result, item) {
    result[item] = (result[item] || 0) + 1
    return result
  }, {})

  return Object.keys(ranked).sort(function (a, b) {
    return ranked[a] - ranked[b]
  })[0]
}
