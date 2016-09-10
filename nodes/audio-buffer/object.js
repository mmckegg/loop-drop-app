var Observ = require('@mmckegg/mutant/value')
var watch = require('@mmckegg/mutant/watch')
var ObservAudioBuffer = require('lib/observ-audio-buffer')
var resolve = require('path').resolve

module.exports = ObservAudioBufferCached

var cachePerContext = new global.WeakMap()

function ObservAudioBufferCached (context) {
  var obs = Observ({})
  obs.currentValue = Observ()
  obs.cuePoints = Observ()

  var cache = cachePerContext.get(context.audio)
  if (!cache) {
    cache = {}
    cachePerContext.set(context.audio, cache)
  }

  var release = null
  var lastSrc = null

  obs(function (data) {
    if (lastSrc !== data.src) {
      lastSrc = data.src
      update(data.src)
    }
  })

  obs.destroy = function () {
    update(null)
  }

  return obs

  // scoped

  function update (src) {
    release && release()
    release = null

    if (src) {
      var path = resolve(context.cwd, src)
      var instance = cache[path]

      if (!instance) {
        instance = cache[path] = ObservAudioBuffer(context)
        instance.listeners = []
        instance.set(obs())
      }

      var releaseResolved = watch(instance.currentValue, obs.currentValue.set)
      var releaseCuePoints = watch(instance.cuePoints, obs.cuePoints.set)
      instance.listeners.push(obs)

      release = function () {
        releaseResolved()
        releaseCuePoints()
        instance.listeners.splice(instance.listeners.indexOf(obs), 1)
        if (instance.listeners.length === 0) {
          instance.destroy()
          delete cache[path]
        }
      }
    } else {
      obs.currentValue.set(null)
      obs.cuePoints.set(null)
    }
  }
}
