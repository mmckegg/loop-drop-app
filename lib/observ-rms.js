var Value = require('@mmckegg/mutant/value')
var gainToDecibels = require('decibels/from-gain')

module.exports = ObservRms

function ObservRms (audioNode) {
  var value = [-Infinity, -Infinity]
  var obs = Value(value)
  var broadcast = obs.set
  obs.set = null

  var audioContext = audioNode.context

  var meter = audioContext.createScriptProcessor(512 * 2, 2, 2)
  audioNode.connect(meter)

  var lastL = 0
  var lastR = 0
  var smoothing = 0.8

  meter.onaudioprocess = function (e) {
    var inputL = e.inputBuffer.getChannelData(0)
    var inputR = e.inputBuffer.getChannelData(1)
    var rmsL = Math.max(rms(inputL), lastL * smoothing)
    var rmsR = Math.max(rms(inputR), lastR * smoothing)
    if (rmsL !== lastL || rmsR !== lastR) {
      value[0] = gainToDecibels(rmsL)
      value[1] = gainToDecibels(rmsR)
      broadcast(value)
      lastL = rmsL
      lastR = rmsR
    }
  }

  meter.connect(audioContext.destination)

  return obs
}

function rms (input) {
  var sum = 0
  for (var i = 0; i < input.length; i++) {
    sum += input[i] * input[i]
  }
  return Math.sqrt(sum / input.length)
}
