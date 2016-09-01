var Node = require('observ-node-array/single')
var ResolvedValue = require('observ-node-array/resolved-value')
var Param = require('lib/param')
var Property = require('observ-default')
var Transform = require('lib/param-transform')
var Apply = require('lib/apply-param')

var Triggerable = require('lib/triggerable')
var ScheduleEvent = require('lib/schedule-event')

module.exports = SampleNode

function SampleNode (context) {
  var output = context.audio.createGain()
  var amp = context.audio.createGain()
  amp.gain.value = 0
  amp.connect(output)

  var obs = Triggerable(context, {
    mode: Property('hold'),
    offset: Property([0, 1]),
    buffer: Node(context),

    amp: Param(context, 1),
    transpose: Param(context, 0),
    tune: Param(context, 0)
  }, trigger)

  obs.resolvedBuffer = ResolvedValue(obs.buffer)
  obs.context = context

  var playbackRate = Transform(context, [ 1,
    { param: context.noteOffset, transform: noteOffsetToRate },
    { param: obs.transpose, transform: noteOffsetToRate },
    { param: obs.tune, transform: centsToRate }
  ])

  Apply(context, amp.gain, obs.amp)

  obs.connect = output.connect.bind(output)
  obs.disconnect = output.disconnect.bind(output)

  return obs

  // scoped
  function trigger (at) {
    var buffer = obs.resolvedBuffer()
    var mode = obs.mode()

    if (buffer instanceof window.AudioBuffer) {
      var choker = context.audio.createGain()
      var player = context.audio.createBufferSource()
      player.connect(choker)
      choker.connect(amp)

      player.buffer = buffer
      player.loopStart = buffer.duration * obs.offset()[0]
      player.loopEnd = buffer.duration * obs.offset()[1]

      var event = new ScheduleEvent(at, player, choker, [
        Apply(context, player.playbackRate, playbackRate),
        choker.disconnect.bind(choker)
      ])

      event.maxTo = at + (buffer.duration - player.loopStart) / playbackRate.getValueAt(at)
      event.to = at + (player.loopEnd - player.loopStart) / playbackRate.getValueAt(at)

      if (mode === 'loop') {
        player.loop = true
        event.to = null
      }

      if (mode === 'release') {
        event.to = null
        event.stop = function (at) {
          if (at) {
            player.start(at, player.loopStart, (player.loopEnd - player.loopStart) / playbackRate.getValueAt(at))
          }
        }
      } else {
        player.start(at, player.loopStart)
      }

      if (mode === 'oneshot') {
        event.oneshot = true
      }

      return event
    }
  }
}

function noteOffsetToRate (baseRate, value) {
  return baseRate * Math.pow(2, value / 12)
}

function centsToRate (baseRate, value) {
  return baseRate * Math.pow(2, value / 1200)
}
