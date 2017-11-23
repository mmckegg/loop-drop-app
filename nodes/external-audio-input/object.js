var Struct = require('mutant/struct')
var Property = require('lib/property')
var watch = require('mutant/watch')
var computed = require('mutant/computed')
var Value = require('mutant/value')

module.exports = ExternalAudioInputNode

function ExternalAudioInputNode (context) {
  var obs = Struct({
    port: Property(),
    includeInRecording: Property(true)
  })

  // read this for status in UI
  obs.connected = Value()

  var deviceId = computed([context.audioDevices.input, obs.port], (devices, name) => {
    var item = devices.find(d => d.label === name)
    if (item) {
      return item.deviceId
    }
  }, {nextTick: true})

  var input = null
  var mediaStream = null
  obs.output = context.audio.createGain()

  var releases = [
    watch(deviceId, (deviceId) => {
      if (deviceId) {
        navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId,
            echoCancellation: {exact: false}
          }
        }).then((result) => {
          window.thing = result
          if (mediaStream) mediaStream.getAudioTracks()[0].stop()
          if (input) input.disconnect()

          mediaStream = result
          input = context.audio.createMediaStreamSource(mediaStream)
          input.connect(obs.output)
          obs.connected.set(true)
        }).catch(() => {
          close()
        })
      } else {
        close()
      }
    })
  ]

  obs.context = context

  obs.destroy = function () {
    close()
    while (releases.length) {
      releases.pop()()
    }
  }

  return obs

  function close () {
    if (mediaStream) mediaStream.getAudioTracks()[0].stop()
    if (input) input.disconnect()
    mediaStream = null
    input = null
    obs.connected.set(false)
  }
}
