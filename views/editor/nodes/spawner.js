var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')

module.exports = Spawner

function Spawner(collection, options){
  var buttons = []

  for (var i=0;i<options.nodes.length;i++){
    buttons.push(h('button Button -main -spawn', {
      'ev-click': send(spawn, {descriptor: options.nodes[i][1], collection: collection })
    }, '+ ' + options.nodes[i][0]))
  }

  return h('NodeSpawner', buttons)
}

function spawn(opts){
  if (opts.descriptor && opts.collection){
    opts.collection.push(opts.descriptor)
  }
}