var computed = require('lib/computed-next-tick')
var Property = require('observ-default')

var Param = require('lib/param')
var Apply = require('lib/apply-param')
var Triggerable = require('lib/triggerable')
var ScheduleEvent = require('lib/schedule-event')

var KickEight = require('./kick-eight')
var KickNine = require('./kick-nine')

module.exports = KickNode

function KickNode (context) {
  var output = context.audio.createGain()
  var amp = context.audio.createGain()
  amp.gain.value = 0
  amp.connect(output)

  var obs = Triggerable(context, {
    type: Property('808'),
    tone: Param(context, 0.1), // ratio
    decay: Param(context, 0.5), // seconds
    tune: Param(context, 0), // cents
    amp: Param(context, 0.4)
  }, trigger)

  var currentParams = {}

  var getCtor = computed([obs.type], function (type) {
    if (type === '909') {
      return KickNine(context.audio, currentParams)
    } else {
      return KickEight(context.audio, currentParams)
    }
  })

  obs.context = context

  Apply(context, amp.gain, obs.amp)

  obs.connect = output.connect.bind(output)
  obs.disconnect = output.disconnect.bind(output)

  return obs

  // scoped
  function trigger (at) {
    // HACK: apply params
    currentParams.tone = obs.tone.getValueAt(at) * 128
    currentParams.decay = obs.decay.getValueAt(at) / 2.2 * 128
    currentParams.tune = obs.tune.getValueAt(at) + 64

    var choker = context.audio.createGain()
    var source = getCtor()()
    source.connect(choker)
    choker.connect(amp)
    source.start(at)

    var event = new ScheduleEvent(at, source, choker)
    event.oneshot = true
    event.to = at + obs.decay.getValueAt(at)
    return event
  }
}
