var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

module.exports = Spawner

function Spawner(collection, options){
  var buttons = []

  for (var i=0;i<options.nodes.length;i++){
    buttons.push(h('button Button -main -spawn', {
      'ev-click': mercury.event(spawn, {descriptor: options.nodes[i][1], collection: collection })
    }, '+ ' + options.nodes[i][0]))
  }

  return h('NodeSpawner', buttons)
}

function spawn(opts){
  if (opts.descriptor && opts.collection){
    opts.collection.push(opts.descriptor)
  }
}