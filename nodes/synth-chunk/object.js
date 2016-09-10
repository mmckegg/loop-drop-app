var Property = require('lib/property')
var Param = require('lib/param')
var Slots = require('lib/slots')
var Struct = require('@mmckegg/mutant/struct')
var BaseChunk = require('lib/base-chunk')
var ExternalRouter = require('lib/external-router')
var lookup = require('@mmckegg/mutant/lookup')
var computed = require('@mmckegg/mutant/computed')
var watch = require('@mmckegg/mutant/watch')
var extend = require('xtend')
var applyMixerParams = require('lib/apply-mixer-params')
var destroyAll = require('lib/destroy-all')

module.exports = SynthChunk

function SynthChunk (parentContext) {
  var context = Object.create(parentContext)
  context.output = context.audio.createGain()
  context.output.connect(parentContext.output)

  var slots = Slots(context)
  context.slotLookup = lookup(slots, 'id')

  var obs = BaseChunk(context, {
    osc1: Osc(context),
    osc2: Osc(context, {
      optional: true
    }),
    osc3: Osc(context, {
      optional: true,
      allowMultiply: true
    }),
    offset: Param(context, 0),
    amp: Param(context, 1),
    filter: Filter(context),
    eq: EQ(context),
    outputs: Property(['output']),
    volume: Property(1),
    routes: ExternalRouter(context, {output: '$default'})
  })

  applyMixerParams(obs)
  obs.overrideVolume = Property(1)

  var volume = computed([obs.volume, obs.overrideVolume], function (a, b) {
    return a * b
  })

  context.offset = obs.offset

  obs.amp.triggerable = true

  var scale = Property({
    offset: 0,
    notes: [0,2,4,5,7,9,11]
  })

  if (context.globalScale) {
    var releaseGlobalScale = watch(context.globalScale, scale.set)
  }

  var computedSlots = computed([
    obs.shape, obs.osc1, obs.osc2, obs.osc3, obs.filter, obs.amp, obs.eq, volume, scale
  ], function (shape, osc1, osc2, osc3, filter, amp, eq, volume, scale) {
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
      var noteOffset = {
        node: 'modulator/scale',
        value: i,
        scale: scale
      }

      var sources = [
        extend(osc1, {node: 'source/oscillator' })
      ]

      var processors = [
        extend(filter, {node: 'processor/filter'}),
        { node: 'processor/gain',
          gain: amp
        }
      ]

      if (osc2.enabled) {
        sources.push(extend(osc2, {
          node: 'source/oscillator'
        }))
      }

      if (osc3.enabled) {
        if (osc3.multiply) {
          processors.unshift({
            node: 'processor/ring-modulator',
            carrier: osc3
          })
        } else {
          sources.push(extend(osc3,
            {node: 'source/oscillator'
          }))
        }
      }

      result.push({
        node: 'slot',
        id: String(i),
        output: 'output',
        noteOffset: noteOffset,
        sources: sources,
        processors: processors
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

  slots.onNodeChange(obs.routes.refresh)

  obs.destroy = function () {
    destroyAll(obs)
    slots.destroy()
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

function Osc (context, opts) {

  var props = {
    amp: Param(context, 0.4),
    shape: Property('sine'),
    octave: Param(context, 0),
    detune: Param(context, 0)
  }

  if (opts && opts.optional) {
    props['enabled'] = Property(false)
  }

  if (opts && opts.allowMultiply) {
    props['multiply'] = Property(false)
  }

  var obs = Struct(props)
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
