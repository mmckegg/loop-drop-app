var Observ = require('mutant/value')
var watch = require('mutant/watch')
var ObservAudioBuffer = require('lib/observ-audio-buffer')
var Path = require('path')
var computed = require('mutant/computed')

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
  var src = computed(obs, descriptor => descriptor.src)
  var path = computed([context.cwd, src], (a, b) => a && b && Path.resolve(a, b) || null)

  var unwatch = watch(path, update)

  obs.destroy = function () {
    unwatch()
    update(null)
  }

  return obs

  // scoped

  function update (path) {
    release && release()
    release = null

    if (path) {
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
