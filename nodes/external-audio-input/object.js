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
  })

  var input = null
  var mediaStream = null
  obs.output = context.audio.createGain()

  var releases = [
    watch(deviceId, (deviceId) => {
      navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId,
          echoCancellation: false
        }
      }).then((result) => {
        if (mediaStream) mediaStream.getAudioTracks()[0].stop()
        if (input) input.disconnect()

        mediaStream = result
        input = context.audio.createMediaStreamSource(mediaStream)
        input.connect(obs.output)
        obs.connected.set(true)
      }, () => {
        if (mediaStream) mediaStream.getAudioTracks()[0].stop()
        if (input) input.disconnect()
        mediaStream = null
        input = null
        obs.connected.set(false)
      })
    })
  ]

  obs.context = context

  obs.destroy = function () {
    if (mediaStream) mediaStream.getAudioTracks()[0].stop()
    if (input) input.disconnect()
    while (releases.length) {
      releases.pop()()
    }
  }

  return obs
}
