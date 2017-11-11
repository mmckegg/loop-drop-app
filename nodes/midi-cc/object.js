var Struct = require('mutant/struct')
var computed = require('mutant/computed')
var applyMidiParam = require('lib/apply-midi-param')
var Property = require('lib/property')
var Param = require('lib/param')
var destroyAll = require('lib/destroy-all')
var clamp = require('lib/clamp')

module.exports = MidiCCNode

function MidiCCNode (context) {
  var port = context.midiPort
  var channel = context.midiChannel

  var obs = Struct({
    code: Property(1),
    value: Param(context, 0)
  })

  Param.triggerOn(obs, context.audio.currentTime)

  var message = computed([channel, obs.code], (channel, code) => {
    return [176 + clamp(channel, 1, 16) - 1, code]
  })

  var releaseMidiParam = applyMidiParam(context, { port, message }, obs.value)

  obs.resend = releaseMidiParam.resend

  obs.destroy = function () {
    destroyAll(obs)
    releaseMidiParam()
  }

  obs.context = context

  return obs
}
