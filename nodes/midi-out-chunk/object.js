var computed = require('mutant/computed')
var Param = require('lib/param')
var Property = require('lib/property')
var BaseChunk = require('lib/base-chunk')
var destroyAll = require('lib/destroy-all')
var applyMixerParams = require('lib/apply-mixer-params')
var applyMidiParam = require('lib/apply-midi-param')
var Slots = require('lib/slots')
var clamp = require('lib/clamp')

module.exports = MidiOutChunk

function MidiOutChunk (parentContext) {
  var context = Object.create(parentContext)

  var offset = Param(context, 0)
  var shape = Property([1, 4])
  context.shape = shape
  context.offset = offset

  var overrideParams = applyMixerParams(context)
  var innerChunk = context.nodes['chunk/scale'](context)
  context.slotLookup = innerChunk.slotLookup

  innerChunk.set({
    scale: '$global',
    templateSlot: {
      id: { $param: 'id' },
      node: 'slot',
      output: 'output',
      noteOffset: {
        node: 'modulator/scale',
        scale: '$inherit',
        value: { $param: 'value' }
      }
    }
  })

  var templateSlot = innerChunk.templateSlot.node
  var sources = templateSlot.sources

  var midiNote = sources.push({
    node: 'source/midi-out',
    note: {
      node: 'modulator/offset',
      value: {
        node: 'modulator/offset',
        value: 69,
        offset: {
          node: 'modulator/multiply',
          value: 0, // octave
          multiplier: 12
        }
      },
      offset: 0 // noteOffset
    },
    velocity: {
      node: 'modulator/multiply',
      value: 100, // velocity
      multiplier: 1 // velocityMultiplier
    },
    channel: 1
  })

  context.midiPort = midiNote.port
  context.midiChannel = midiNote.channel

  var octave = midiNote.note.node.value.node.offset.node.value
  var noteOffset = midiNote.note.node.offset
  var velocity = midiNote.velocity.node.value
  var velocityMultiplier = midiNote.velocity.node.value

  var obs = BaseChunk(context, {
    shape,
    port: midiNote.port,
    channel: midiNote.channel,
    globalAftertouch: Param(context, 0),
    continuousControllers: Slots(context),
    pitchBend: Param(context, 0), // 14 bit midi param, -1 to +1
    noteOffset,
    octave,
    velocity,
    triggerOffset: midiNote.triggerOffset,
    aftertouch: midiNote.aftertouch,
    offset
  })

  var releasePitchBend = applyMidiParam(context, {
    port: context.midiPort,
    message: computed(obs.channel, channel => {
      // 14 bit midi
      return 224 + clamp(channel, 1, 16) - 1
    })
  }, obs.pitchBend)

  var releaseGlobalAftertouch = applyMidiParam(context, {
    port: context.midiPort,
    message: computed(obs.channel, channel => {
      return [208 + clamp(channel, 1, 16) - 1]
    })
  }, obs.globalAftertouch)

  obs.resend = function () {
    obs.continuousControllers.forEach(slot => {
      slot.resend && slot.resend()
    })
  }

  obs.pitchBend.triggerOn(context.audio.currentTime)
  obs.globalAftertouch.triggerOn(context.audio.currentTime)

  obs.noteOffset.readMode = 'trigger'
  obs.octave.readMode = 'trigger'
  obs.velocity.readMode = 'trigger'

  obs.overrideVolume = velocityMultiplier
  context.offset = obs.offset

  obs.overrideParams = overrideParams
  obs.params = applyMixerParams.params(obs)

  obs.destroy = function () {
    destroyAll(obs)
    releasePitchBend()
    releaseGlobalAftertouch()
    innerChunk.destroy()
  }

  return obs
}
