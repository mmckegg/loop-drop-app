var Struct = require('mutant/struct')
var Property = require('lib/property')
var watch = require('mutant/watch')
var computed = require('mutant/computed')
var Value = require('mutant/value')

module.exports = ExternalAudioInputNode

function ExternalAudioInputNode (context) {
  var obs = Struct({
    port: Property(),
    minimised: Property(false),
    includeInRecording: Property(true),
    monitor: Property(false)
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
  var monitoring = false
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
    }),
    watch(obs.monitor, (value) => {
      if (value && !monitoring) {
        monitoring = true
        obs.output.connect(context.masterOutput)
      } else if (!value && monitoring) {
        monitoring = false
        obs.output.disconnect(context.masterOutput)
      }
    })
  ]

  obs.context = context

  obs.destroy = function () {
    close()
    while (releases.length) {
      releases.pop()()
    }
    if (monitoring) {
      try {
        obs.output.disconnect(context.masterOutput)
      } catch (ex) {
        // already disconnect, never mind!
      }
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
