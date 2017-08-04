var Observ = require('mutant/value')
var watch = require('mutant/watch')
var computed = require('mutant/computed')
var Path = require('path')
var ObservFile = require('lib/observ-file')

module.exports = ObservAudioBuffer

function ObservAudioBuffer (context) {
  var obs = Observ({})
  obs.currentValue = Observ()
  obs.cuePoints = Observ()

  var releases = []

  var src = computed(obs, descriptor => descriptor.src)
  var path = computed([context.cwd, src], (a, b) => a && b && Path.resolve(a, b) || null)

  var unwatch = watch(path, (path) => {
    if (path) {
      var timePath = path + '.time'

      while (releases.length) {
        releases.pop()()
      }

      context.fs.exists(path, function (exists) {
        if (exists) {
          var file = ObservFile(path, 'arraybuffer')
          parseAudioBuffer(file, obs.currentValue.set, context.audio)
          releases.push(file.close)
        } else {
          obs.currentValue.set(null)
        }
      })

      context.fs.exists(timePath, function (exists) {
        if (exists) {
          var file = ObservFile(timePath, 'arraybuffer')
          parseFloat32Array(file, obs.cuePoints.set)
          releases.push(file.close)
        } else {
          obs.cuePoints.set(null)
        }
      })
    }
  })

  obs.destroy = function () {
    unwatch()
    while (releases.length) {
      releases.pop()()
    }
  }

  return obs
}

function parseFloat32Array (obs, target) {
  return watch(obs, function (data) {
    if (data) {
      target(new Float32Array(data))
    } else {
      target(null)
    }
  })
}

function parseAudioBuffer (obs, target, audioContext) {
  return watch(obs, function (data) {
    if (data) {
      audioContext.decodeAudioData(data, function (audioBuffer) {
        target(audioBuffer)
      }, function (err) {
        if (err) throw err
        target(null)
      })
    } else {
      target(null)
    }
  })
}
