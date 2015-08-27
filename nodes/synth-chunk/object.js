var Property = require('observ-default')
var Param = require('audio-slot-param')
var Node = require('observ-node-array/single')
var NodeArray = require('observ-node-array')
var Struct = require('observ-struct')
var BaseChunk = require('lib/base-chunk')
var ExternalRouter = require('lib/external-router')
var lookup = require('observ-node-array/lookup')
var computed = require('observ/computed')
var watch = require('observ/watch')
var throttle = require('throttle-observ')
var throttleWatch = require('throttle-observ/watch')
var extend = require('xtend')
var applyScale = require('lib/apply-scale')

module.exports = SynthChunk

function SynthChunk (parentContext) {
  var context = Object.create(parentContext)
  var output = context.output = context.audio.createGain()
  context.output.connect(parentContext.output)

  var slots = NodeArray(context)
  context.slotLookup = lookup(slots, 'id')

  var obs = BaseChunk(context, {
    osc1: Osc(context),
    osc2: Osc(context),
    osc3: Osc(context),
    filter: Filter(context),
    eq: EQ(context),
    outputs: Property(['output']),
    volume: Property(1),
    routes: ExternalRouter(context)
  })

  var scale = Property({
    offset: 0, 
    notes: [0,2,4,5,7,9,11]
  })

  if (context.globalScale){
    var releaseGlobalScale = watch(context.globalScale, scale.set)
  }
  
  var computedSlots = computed([
    obs.shape, obs.osc1, obs.osc2, obs.osc3, obs.filter, obs.eq, obs.volume, scale
  ], function (shape, osc1, osc2, osc3, filter, eq, volume, scale) {
    var length = shape[0] * shape[1]

    var result = [{
      node: 'slot',
      id: 'output',
      volume: volume,
      processors: [
        extend(eq, {node: 'processor/eq'}),
      ]
    }]

    for (var i = 0; i < length; i++) {

      var noteOffset = applyScale(i, scale)

      result.push({
        node: 'slot',
        id: String(i),
        output: 'output',
        noteOffset: noteOffset,
        sources: [
          extend(osc1, {node: 'source/oscillator' }),
          extend(osc2, {node: 'source/oscillator' }),
          extend(osc3, {node: 'source/oscillator' })
        ],
        processors: [
          extend(filter, {node: 'processor/filter'})
        ]
      })
    }

    return result
  })

  computedSlots(slots.set)

  //throttleWatch(computedSlots, 50, function (value) {
  //  slots.set(value)
//
  //  // HACK: bump shape to trigger update of slot mapping
  //  obs.shape.set(obs.shape())
  //})

  slots.onUpdate(obs.routes.reconnect)

  obs.destroy = function(){
    obs.routes.destroy()
    releaseGlobalScale && releaseGlobalScale()
    releaseGlobalScale = null
  }

  return obs
}

function Filter (context) {
  var obs = Struct({
    type: Property('lowpass'),
    frequency: Param(context, 20000),
    Q: Param(context, 1)
  })

  obs.type.triggerable = true
  obs.frequency.triggerable = true
  obs.Q.triggerable = true

  return obs
}

function Osc (context) {
  var obs = Struct({
    amp: Param(context, 0.4),
    shape: Property('sine'),
    octave: Param(context, 0),
    detune: Param(context, 0)
  })

  obs.amp.triggerable = true
  obs.shape.triggerable = true
  obs.octave.triggerable = true
  obs.detune.triggerable = true

  return obs
}

function EQ (context) {
  return Struct({
    lowcut: Param(context, 0),
    highcut: Param(context, 20000),
    low: Param(context, 0),
    mid: Param(context, 0),
    high: Param(context, 0)
  })
}