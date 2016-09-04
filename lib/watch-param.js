var watch = require('@mmckegg/mutant/watch')

module.exports = function (param, listener, continuous) {
  var releaseProcessor = null
  var releaseWatch = watch(param, function (value) {
    if (releaseProcessor) {
      releaseProcessor()
      releaseProcessor = null
    }
    if (value instanceof global.AudioNode) {
      releaseProcessor = watchAudioNode(value, listener, continuous)
    } else {
      listener(value)
    }
  })

  return function () {
    if (releaseProcessor) {
      releaseProcessor()
    }
    releaseWatch()
  }
}

function watchAudioNode (param, listener, continuous) {
  var lastBroadcastValue = 0
  var processor = param.context.createScriptProcessor(256, 1, 1)
  processor.onaudioprocess = function (e) {
    var data = e.inputBuffer.getChannelData(0)
    var value = data[data.length - 1]
    if (value !== lastBroadcastValue || continuous) {
      lastBroadcastValue = value
      listener(value)
    }
  }

  param.connect(processor)
  processor.connect(param.context.destination)

  listener(0)

  return function () {
    processor.disconnect()
    processor.onaudioprocess = null
  }
}
