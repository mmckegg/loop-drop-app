var Observ = require('@mmckegg/mutant/value')
var watch = require('@mmckegg/mutant/watch')
var resolve = require('path').resolve
var ObservFile = require('lib/observ-file')

module.exports = ObservAudioBuffer

function ObservAudioBuffer (context) {
  var obs = Observ({})
  obs.currentValue = Observ()
  obs.cuePoints = Observ()

  var releases = []
  var lastSrc = null

  obs(function (data) {
    if (lastSrc !== data.src) {
      lastSrc = data.src
      update(data.src)
    }
  })

  function update (src) {
    var path = resolve(context.cwd, src)
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

  obs.destroy = function () {
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
        target(null)
      })
    } else {
      target(null)
    }
  })
}
