var h = require('lib/h')
var send = require('value-event/event')
var extend = require('xtend')

module.exports = Spawner

function Spawner(collection, options){
  var buttons = []

  for (var i=0;i<options.nodes.length;i++) {
    var node = options.nodes[i]
    var descriptor = getDescriptor(node)

    if (descriptor) {
      buttons.push(h('button Button -main -spawn', {
        'ev-click': send(spawn, {descriptor: descriptor, collection: collection })
      }, '+ ' + node.name))
    }
  }

  return h('NodeSpawner', buttons)
}

function spawn(opts){
  if (opts.descriptor && opts.collection){
    opts.collection.push(opts.descriptor)
  }
}

function getDescriptor (info) {
  var result = { node: info.node }
  if (info.spawn === false ){
    return null
  } else if (info.spawn instanceof Object) {
    return extend(result, info.spawn)
  } else {
    return result
  }
}