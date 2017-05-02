var destroyerCache = new WeakMap()

module.exports = destroySourceNode

function destroySourceNode (node) {
  node.disconnect()

  if (node.stop) {
    var destroyer = destroyerCache.get(node.context)

    if (!destroyer) {
      destroyer = node.context.createGain()
      destroyer.gain.value = 0
      destroyer.connect(node.context.destination)
      destroyerCache.set(node.context, destroyer)
    }

    // HACK: collect disconnected nodes to ensure they stop correctly
    // see https://bugs.chromium.org/p/chromium/issues/detail?id=717528
    node.connect(destroyer)
    node.stop()
  }
}
