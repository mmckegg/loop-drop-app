var Property = require('lib/property')
var Param = require('lib/param')
var watch = require('mutant/watch')
var Struct = require('mutant/struct')
var BaseChunk = require('lib/base-chunk')
var ExternalRouter = require('lib/external-router')
var computed = require('mutant/computed')
var applyMixerParams = require('lib/apply-mixer-params')
var destroyAll = require('lib/destroy-all')
var watchNodesChanged = require('lib/watch-nodes-changed')

module.exports = SynthChunk

function SynthChunk (parentContext) {
  var context = Object.create(parentContext)
  context.output = context.audio.createGain()
  context.output.connect(parentContext.output)

  var overrideParams = applyMixerParams(context)

  var offset = Param(context, 0)
  var shape = Property([1, 4])
  context.shape = shape
  context.offset = offset

  var innerChunk = context.nodes['chunk/scale'](context)
  innerChunk.set({
    scale: '$global',
    templateSlot: {
      id: { $param: 'id' },
      node: 'slot',
      output: 'output',
      sources: [],
      noteOffset: {
        node: 'modulator/scale',
        scale: '$inherit',
        value: { $param: 'value' }
      }
    }
  })

  var outputSlot = innerChunk.slots.push({
    node: 'slot',
    id: 'output'
  })

  var templateSlot = innerChunk.templateSlot.node
  var sources = templateSlot.sources
  var processors = templateSlot.processors

  var osc1 = sources.push({
    node: 'source/oscillator'
  })

  var osc2 = null
  var osc3 = null
  var oscMult = null

  var filter = processors.push({
    node: 'processor/filter'
  })

  var eq = processors.push({
    node: 'processor/eq'
  })

  var amp = processors.push({
    node: 'processor/gain'
  })

  context.slotLookup = innerChunk.slotLookup

  var overrideVolume = Property(1)
  var volume = Property(1)

  var obs = BaseChunk(context, {
    shape,
    osc1: Osc(context),
    osc2: Osc(context, {
      optional: true
    }),
    osc3: Osc(context, {
      optional: true,
      allowMultiply: true
    }),
    offset,
    amp: amp.gain,
    filter: Filter(context),
    eq: EQ(context),
    outputs: innerChunk.outputs,
    volume: outputSlot.volume,
    routes: ExternalRouter(context, {output: '$default'}, computed([volume, overrideVolume], multiply))
  })

  obs.overrideParams = overrideParams
  obs.params = applyMixerParams.params(obs)
  obs.overrideVolume = overrideVolume

  watch(obs.eq, eq.set)
  watch(obs.filter, filter.set)
  watch(obs.osc1, osc1.set)
  watch(obs.osc2, value => {
    if (value.enabled) {
      if (!osc2) osc2 = sources.push({node: 'source/oscillator'})
      osc2.set(value)
    } else if (osc2) {
      sources.remove(osc2)
    }
  })
  watch(obs.osc3, value => {
    if (value.enabled && !value.multiply) {
      if (!osc3) osc3 = sources.push({node: 'source/oscillator'})
      osc3.set(value)
    } else if (osc3) {
      sources.remove(osc3)
    }

    if (value.enabled && value.multiply) {
      if (!oscMult) oscMult = processors.insert({node: 'processor/ring-modulator'}, 0)
      oscMult.carrier.set(value)
    } else if (oscMult) {
      processors.remove(oscMult)
    }
  })

  obs.amp.triggerable = true

  watchNodesChanged(context.slotLookup, obs.routes.refresh)

  obs.destroy = function () {
    destroyAll(obs)
    innerChunk.destroy()
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

function multiply (a, b) {
  return a * b
}
