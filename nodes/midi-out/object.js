var Triggerable = require('lib/triggerable')
var Param = require('lib/param')
var Property = require('lib/property')
var Sum = require('lib/param-sum')
var MidiNote = require('lib/midi-note')
var applyMidiParam = require('lib/apply-midi-param')
var ScheduleEvent = require('lib/schedule-event')
var resolve = require('mutant/resolve')
var clamp = require('lib/clamp')

module.exports = MidiOutNode

function MidiOutNode (context) {
  var lastEvent = null

  var midiPort = context.outputMidiPort // MidiPort(context, null, {output: true, shared: true})
  var midiChannel = context.outputMidiChannel
  var triggerOffset = context.outputMidiTriggerOffset

  var obs = Triggerable(context, {
    note: Param(context, 69),
    velocity: Param(context, 100),
    aftertouch: Param(context, 0),

    // when used as a slot in midi-out-chunk
    id: Property(),
    noteOffset: Param(context, 0)

  }, trigger)

  obs.note.readMode = 'trigger'
  obs.velocity.readMode = 'trigger'

  obs.context = context

  var noteOffset = Sum([
    context.noteOffset || obs.noteOffset,
    obs.note
  ])

  return obs

  // scoped
  function trigger (at) {
    var output = midiPort.stream()
    var velocity = obs.velocity.getValueAtTime(at)
    if (!output || !velocity) return
    var noteId = noteOffset.getValueAtTime(at)
    var note = MidiNote(context, {
      output,
      channel: resolve(midiChannel),
      note: noteOffset.getValueAtTime(at),
      velocity,
      offset: triggerOffset()
    })
    var aftertouchMessage = [ 160 + clamp(Math.round(resolve(midiChannel)), 1, 16) - 1, noteId ]
    lastEvent = new ScheduleEvent(at, note, null, [
      applyMidiParam(context, {port: midiPort, message: aftertouchMessage}, obs.aftertouch)
    ])
    note.start(at)
    return lastEvent
  }
}
