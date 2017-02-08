var ArrayGrid = require('array-grid')
var Observ = require('mutant/value')
var ObservDefault = require('lib/property')
var ObservStruct = require('mutant/struct')
var Event = require('geval')
var computed = require('mutant/computed')
var getEvents = require('lib/get-events')

module.exports = LoopGrid

function LoopGrid (context) {
  var obs = ObservStruct({
    shape: ObservDefault([8, 8]),
    loops: ObservDefault([]),
    targets: ObservDefault([]),
    loopLength: ObservDefault(8)
  })

  var listen = Listener()

  obs.loopPosition = Observ([0, 8])
  obs.context = context

  // state layers
  obs.grid = computed([obs.targets, obs.shape], ArrayGrid)
  obs.playing = Observ(ArrayGrid([], obs.shape()))
  obs.active = computed([obs.loops, obs.shape], function (loops, shape) {
    return ArrayGrid(loops.map(function (loop) {
      return (loop && loop.length && Array.isArray(loop.events) && loop.events.length)
    }), shape)
  })

  var current = {}
  var currentlyPlaying = {}
  var overriding = {}
  var pendingPlayingUpdate = false
  var lastPosition = -1

  obs.onEvent = Event(function (broadcast) {
    obs.triggerEvent = broadcast

    obs.triggerEvent = function (event) {
      if (event.id) {
        if (event.event === 'start') {
          overriding[event.id] = true
        } else {
          overriding[event.id] = false
        }

        if (!current[event.id]) {
          broadcast(event)
        }
      }
    }

    listen(context.scheduler.onSchedule, function (schedule) {
      var targets = obs.targets()
      targets.forEach(function (id, index) {
        var loop = obs.loops()[index]
        getEvents(loop, schedule.from, schedule.to, 1).forEach(function (event) {
          if (id && current[id] !== event[1] && !(!current[id] && !event[1])) {
            var delta = (event[0] - schedule.from) * schedule.beatDuration
            current[id] = event[1]
            if (!overriding[id]) {
              broadcast({
                id: id,
                event: event[1] ? 'start' : 'stop',
                position: event[0],
                time: schedule.time + delta
              })
            }
          }
        })
      })

      // stop any notes that are no longer targets
      Object.keys(current).forEach(function (id) {
        if (!~targets.indexOf(id)) {
          delete current[id]
          if (current[id]) {
            broadcast({
              id: id,
              event: 'stop',
              position: schedule.from,
              time: schedule.time
            })
          }
        }
      })

      // update playback position
      if (Math.floor(schedule.from * 10) > Math.floor(lastPosition * 10)) {
        var loopLength = obs.loopLength() || 8
        var pos = Math.floor(schedule.from * 10) % (loopLength * 10)
        obs.loopPosition.set([pos / 10, loopLength])
        lastPosition = schedule.from
      }
    })

    listen.event(context.scheduler, 'stop', function () {
      Object.keys(current).forEach(function (id) {
        delete current[id]
        if (current[id]) {
          broadcast({
            id: id,
            event: 'stop',
            position: context.scheduler.getCurrentPosition(),
            time: context.audio.currentTime
          })
        }
      })
    })
  })

  obs.onEvent(function (event) {
    if (context.triggerEvent) {
      // send events
      context.triggerEvent(event)
    }

    if (event.event === 'start') {
      currentlyPlaying[event.id] = true
    } else if (event.event === 'stop') {
      currentlyPlaying[event.id] = false
    }

    if (!pendingPlayingUpdate) {
      pendingPlayingUpdate = true
      setImmediate(refreshPlaying)
    }
  })

  obs.destroy = function () {
    listen.releaseAll()
  }

  return obs
  // scoped

  function refreshPlaying () {
    pendingPlayingUpdate = false
    var playing = []
    var targets = obs.targets()
    var shape = obs.shape()
    var max = Array.isArray(shape) && shape[0] * shape[1] || 0
    for (var i = 0; i < max; i++) {
      if (currentlyPlaying[targets[i]]) {
        playing[i] = true
      }
    }
    obs.playing.set(ArrayGrid(playing, shape))
  }
}

function Listener () {
  var releases = []

  function listen (target, listener) {
    releases.push(target(listener))
  }

  listen.event = function (emitter, event, listener) {
    emitter.on(event, listener)
    releases.push(emitter.removeListener.bind(emitter, event, listener))
  }

  listen.releaseAll = function () {
    while (releases.length) {
      releases.pop()()
    }
  }

  return listen
}
