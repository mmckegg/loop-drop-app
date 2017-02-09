var computed = require('mutant/computed')
var Property = require('lib/property')

var Param = require('lib/param')
var Apply = require('lib/apply-param')
var Triggerable = require('lib/triggerable')
var ScheduleEvent = require('lib/schedule-event')
var getParamValue = require('lib/get-param-value')

var Snare = require('./snare')
var RimShot = require('./rim-shot')

module.exports = SnareNode

function SnareNode (context) {
  var output = context.audio.createGain()
  var amp = context.audio.createGain()
  amp.gain.value = 0
  amp.connect(output)

  var releases = []
  var obs = Triggerable(context, {
    type: Property('snare'),
    tune: Param(context, 0), // cents
    tone: Param(context, 0.5), // ratio
    decay: Param(context, 0.2), // seconds
    snappy: Param(context, 0.5), // ratio
    amp: Param(context, 0.4)
  }, trigger, releases)

  var currentParams = {}

  var getCtor = computed([obs.type], function (type) {
    if (type === 'rim') {
      return {fn: RimShot(context.audio, currentParams)}
    } else {
      return {fn: Snare(context.audio, currentParams)}
    }
  })

  obs.context = context

  releases.push(
    Apply(context.audio, amp.gain, obs.amp)
  )

  obs.connect = output.connect.bind(output)
  obs.disconnect = output.disconnect.bind(output)

  return obs

  // scoped
  function trigger (at) {
    // HACK: apply params
    currentParams.tune = getParamValue(obs.tune) + 64
    currentParams.tone = getParamValue(obs.tone) * 128
    currentParams.decay = getParamValue(obs.decay) / 2.2 * 128
    currentParams.snappy = getParamValue(obs.snappy) * 128

    var choker = context.audio.createGain()
    var source = getCtor().fn()
    source.connect(choker)
    choker.connect(amp)
    source.start(at)

    var event = new ScheduleEvent(at, source, choker)

    event.oneshot = true
    event.to = at + getParamValue(obs.decay)
    return event
  }
}
