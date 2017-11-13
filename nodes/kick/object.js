var computed = require('mutant/computed')
var Property = require('lib/property')

var Param = require('lib/param')
var Apply = require('lib/apply-param')
var Triggerable = require('lib/triggerable')
var ScheduleEvent = require('lib/schedule-event')
var getParamValue = require('lib/get-param-value')

var KickEight = require('./kick-lo')
var KickNine = require('./kick-nine')

module.exports = KickNode

function KickNode (context) {
  var output = context.audio.createGain()
  var amp = context.audio.createGain()
  amp.gain.value = 0
  amp.connect(output)

  var releases = []
  var obs = Triggerable(context, {
    type: Property('808'),
    tone: Param(context, 0.4), // ratio
    decay: Param(context, 0.5), // seconds
    tune: Param(context, 0), // cents
    amp: Param(context, 0.6)
  }, trigger, releases)

  var currentParams = {}

  var getCtor = computed([obs.type], function (type) {
    if (type === '909') {
      return {fn: KickNine(context.audio, currentParams)}
    } else {
      return {fn: KickEight(context.audio, currentParams)}
    }
  })

  obs.context = context

  // don't allow envelopes on this params
  obs.tone.readMode = 'trigger'
  obs.decay.readMode = 'trigger'
  obs.tune.readMode = 'trigger'

  releases.push(
    Apply(context.audio, amp.gain, obs.amp)
  )

  obs.connect = output.connect.bind(output)
  obs.disconnect = output.disconnect.bind(output)

  return obs

  // scoped
  function trigger (at) {
    // HACK: apply params
    currentParams.tone = getParamValue(obs.tone) * 128
    currentParams.decay = getParamValue(obs.decay) / 2.2 * 128
    currentParams.tune = getParamValue(obs.tune) + 64

    var choker = context.audio.createGain()
    var source = getCtor().fn()
    source.connect(choker)
    choker.connect(amp)
    var to = source.start(at)

    var event = new ScheduleEvent(at, source, choker)
    event.oneshot = true
    event.to = to || (at + getParamValue(obs.decay))
    return event
  }
}
