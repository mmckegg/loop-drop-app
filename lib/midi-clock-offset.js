var Value = require('mutant/value')

module.exports = function MidiClockOffset (audioContext) {
  var obs = Value(window.performance.now() - audioContext.currentTime * 1000)
  var clockDriftChecker = audioContext.createScriptProcessor(1024 * 8, 0, 1)
  var lastDifference = 0

  clockDriftChecker.onaudioprocess = function (e) {
    var currentOffset = Math.round(window.performance.now() - audioContext.currentTime * 1000)
    var difference = currentOffset - obs()

    // remove jitter
    if (lastDifference !== -difference && currentOffset !== obs()) {
      lastDifference = currentOffset - obs()
      obs.set(Math.round(currentOffset))
    }
  }

  clockDriftChecker.connect(audioContext.destination)

  obs.destroy = function () {
    clockDriftChecker.disconnect()
    clockDriftChecker.onaudioprocess = null
  }

  return obs
}
