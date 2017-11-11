var resolve = require('mutant/resolve')
var clamp = require('lib/clamp')

module.exports = applyMidiParam

function applyMidiParam (context, midiOpts, param) {
  var lastValue = 0
  var offset = window.performance.now() - context.audio.currentTime * 1000
  var midiPort = midiOpts.port
  var prefix = midiOpts.message

  var release = context.scheduler.onSchedule(schedule => {
    var lastTime = schedule.time
    var endTime = lastTime + schedule.duration
    var step = schedule.duration / 2
    for (var at = schedule.time; at < endTime; at += step) {
      var value = param.getValueAtTime(at)
      if (value !== lastValue) {
        var message = getMessage(resolve(prefix), value)
        var output = midiPort.stream()
        if (message && output) {
          output.write(message, getMidiTime(offset, at))
          lastValue = value
        }
      }
    }
  })

  release.resend = function () {
    var message = getMessage(resolve(prefix), lastValue)
    var output = midiPort.stream()
    if (message && output) {
      output.write(message, window.performance.now())
    }
  }

  return release
}

function getMessage (message, value) {
  if (typeof message === 'number') {
    value = clamp(value * 0x2000 + 0x2000, 0, 0x4000 - 1)
    var lsb = value & 0x7F
    var msb = value >> 7 & 0x7F
    return [message, lsb, msb]
  } else if (Array.isArray(message) && (message.length === 1 || message.length === 2)) {
    return message.concat(clamp(Math.round(value), 0, 127))
  }
}

function getMidiTime (offset, at) {
  return at ? (at * 1000) + offset : window.performance.now()
}
