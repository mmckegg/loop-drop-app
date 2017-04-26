var ObservStruct = require('mutant/struct')
var Param = require('lib/param')

module.exports = Triggerable

function Triggerable (context, params, trigger, releases) {
  var obs = ObservStruct(params)
  var lastEvent = null

  obs.getReleaseDuration = Param.getReleaseDuration.bind(this, obs)

  obs.triggerOn = function (at) {
    at = Math.max(at, context.audio.currentTime)
    obs.choke(at)
    Param.triggerOn(obs, at)

    if (lastEvent && lastEvent.reuse && (!lastEvent.to || lastEvent.to > at)) {
      lastEvent.cancelStop(at)
    } else {
      var event = trigger(at)
      if (event) {
        context.cleaner.push(event)
        lastEvent = event

        if (event.to) {
          var stopAt = event.to + obs.getReleaseDuration()
          stopAt = Math.min(stopAt, event.maxTo || stopAt)
          event.stop(stopAt)
          Param.triggerOff(obs, stopAt)
        }
      }
    }
  }

  obs.triggerOff = function (at) {
    at = Math.max(at, context.audio.currentTime)
    if (lastEvent) {
      if (!lastEvent.oneshot) {
        var stopAt = obs.getReleaseDuration() + at
        Param.triggerOff(obs, stopAt)
        lastEvent.stop(stopAt)
      }
    }
  }

  obs.choke = function (at) {
    at = Math.max(at, context.audio.currentTime)
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
    if (releases) {
      while (releases.length) {
        releases.pop()()
      }
    }
  }

  return obs
}
