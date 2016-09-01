var Param = require('audio-slot-param')
var Apply = require('audio-slot-param/apply')
var Triggerable = require('lib/triggerable')
var ScheduleEvent = require('lib/schedule-event')

var HiHat = require('./hi-hat')

module.exports = CymbalNode

function CymbalNode (context) {
  var output = context.audio.createGain()
  var amp = context.audio.createGain()
  amp.gain.value = 0
  amp.connect(output)

  var obs = Triggerable(context, {
    tune: Param(context, 0), // cents
    decay: Param(context, 0.3), // seconds
    amp: Param(context, 0.4)
  }, trigger)

  var currentParams = {}

  var ctor = HiHat(context.audio, currentParams)

  obs.context = context

  Apply(context, amp.gain, obs.amp)

  obs.connect = output.connect.bind(output)
  obs.disconnect = output.disconnect.bind(output)

  return obs

  // scoped
  function trigger (at) {
    // HACK: apply params
    currentParams.tune = obs.tune.getValueAt(at) + 64
    currentParams.decay = obs.decay.getValueAt(at) / 2.2 * 128

    var choker = context.audio.createGain()
    var source = ctor()
    source.connect(choker)
    choker.connect(amp)
    source.start(at)

    var event = new ScheduleEvent(at, source, choker, [
      choker.disconnect.bind(choker)
    ])

    event.oneshot = true
    event.to = at + obs.decay.getValueAt(at)
    return event
  }
}
