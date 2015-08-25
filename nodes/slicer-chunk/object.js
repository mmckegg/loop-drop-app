var Property = require('observ-default')
var Node = require('observ-node-array/single')
var NodeArray = require('observ-node-array')
var Struct = require('observ-struct')
var BaseChunk = require('lib/base-chunk')
var ExternalRouter = require('lib/external-router')
var lookup = require('observ-node-array/lookup')
var computed = require('observ/computed')
var ResolvedValue = require('observ-node-array/resolved-value')

module.exports = SlicerChunk

function SlicerChunk (parentContext) {

  var context = Object.create(parentContext)
  var output = context.output = context.audio.createGain()
  context.output.connect(parentContext.output)

  var slots = NodeArray(context)
  context.slotLookup = lookup(slots, 'id')

  var obs = BaseChunk(context, {
    offset: Property([0, 1]),
    buffer: Node(context),
    outputs: Property(['output']),
    triggerMode: Property('slice'),
    volume: Property(1),
    routes: ExternalRouter(context)
  })

  obs.resolvedBuffer = ResolvedValue(obs.buffer)

  obs.volume(function(value){
    output.gain.value = value
  })

  
  var computedSlots = computed([obs.shape, obs.buffer, obs.offset], function(shape, buffer, offset){
    var length = (shape[0]*shape[1])||0
    var result = []
    var slice = 1 / length

    for (var i=0;i<length;i++){
      var slot = {
        node: 'slot',
        id: String(i),
        output: 'output',
        sources: [
          { node: 'source/sample',
            mode: 'oneshot',
            offset: subOffset(offset, [ 
              i*slice, 
              (i+1) * slice 
            ]),
            buffer: buffer
          }
        ]
      }
      result.push(slot)
    }

    result.push({
      node: 'slot',
      id: 'output',
      processors: []
    })

    return result
  })

  computedSlots(slots.set)
  slots.onUpdate(obs.routes.reconnect)

  obs.destroy = function(){
    obs.routes.destroy()
  }

  return obs
}

function subOffset(main, sub) {
  var range = main[1] - main[0]
  return [
    main[0] + (sub[0] * range), 
    main[0] + (sub[1] * range)
  ]
}