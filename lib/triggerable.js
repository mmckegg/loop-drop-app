var ObservStruct = require('@mmckegg/mutant/struct')
var Param = require('lib/param')

module.exports = Triggerable

function Triggerable (context, params, trigger) {
  var obs = ObservStruct(params)
  var lastEvent = null

  obs.getReleaseDuration = Param.getReleaseDuration.bind(this, obs)

  obs.triggerOn = function (at) {
    obs.choke(at)
    var event = trigger(at)
    if (event) {
      lastEvent = event
      Param.triggerOn(obs, at)

      if (event.to) {
        var stopAt = event.to + obs.getReleaseDuration()
        stopAt = Math.min(stopAt, event.maxTo || stopAt)
        event.stop(stopAt)
        Param.triggerOff(obs, stopAt)
        cleanUpLast()
      }
    }
  }

  obs.triggerOff = function (at) {
    at = at || context.audio.currentTime
    if (lastEvent) {
      if (!lastEvent.oneshot) {
        var stopAt = obs.getReleaseDuration() + at
        lastEvent.stop(stopAt)
        Param.triggerOff(obs, stopAt)
        cleanUpLast()
      }
    }
  }

  obs.choke = function (at) {
    if (lastEvent) {
      lastEvent.choke(at)
    }
  }

  obs.destroy = function () {
    Object.keys(obs).forEach(function (key) {
      if (obs[key] && typeof obs[key].destroy === 'function') {
        obs[key].destroy()
      }
    })
  }

  return obs

  // scoped

  function cleanUpLast () {
    if (lastEvent && lastEvent.releases) {
      while (lastEvent.releases.length) {
        lastEvent.releases.pop()()
      }
    }
  }
}
