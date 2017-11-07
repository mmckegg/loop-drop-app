var ObservStruct = require('mutant/struct')
var Param = require('lib/param')

module.exports = ProcessorNode

function ProcessorNode (context, input, output, params, releases) {
  var obs = ObservStruct(params)

  obs.input = input
  obs.output = output
  obs.connect = output.connect.bind(output)
  obs.disconnect = output.disconnect.bind(output)
  obs.getReleaseDuration = Param.getReleaseDuration.bind(this, obs)
  obs.getAttackDuration = Param.getAttackDuration.bind(this, obs)

  obs.context = context

  obs.triggerOn = function (at) {
    at = at || context.audio.currentTime
    Param.triggerOn(obs, at)
  }

  obs.triggerOff = function (at) {
    at = at || context.audio.currentTime
    var stopAt = obs.getReleaseDuration(at) + at
    Param.triggerOff(obs, stopAt)
  }

  obs.destroy = function () {
    while (releases && releases.length) {
      releases.pop()()
    }
    Object.keys(obs).forEach(function (key) {
      if (obs[key] && typeof obs[key].destroy === 'function') {
        obs[key].destroy()
      }
    })
  }

  return obs
}
