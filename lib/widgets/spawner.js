var h = require('lib/h')
var send = require('@mmckegg/mutant/send')
var spawnNode = require('lib/spawn-node')

module.exports = Spawner

function Spawner (collection, options) {
  var buttons = []

  for (var i = 0; i < options.nodes.length; i++) {
    var descriptor = options.nodes[i]
    if (descriptor && descriptor.spawn !== false) {
      buttons.push(h('button Button -main -spawn', {
        'title': descriptor.description || '',
        'ev-click': send(spawn, {
          descriptor: descriptor,
          collection: collection,
          onSpawn: options.onSpawn
        })
      }, '+ ' + descriptor.name))
    }
  }

  return h('NodeSpawner', buttons)
}

function spawn (opts) {
  spawnNode(opts.collection, opts.descriptor.node, function (err, node) {
    opts.onSpawn && opts.onSpawn(node)
  })
}
