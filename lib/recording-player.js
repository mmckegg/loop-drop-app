var Clock = require('bopper')
var JsonFile = require('loop-drop-project/json-file')
var Observ = require('observ')
var watch = require('observ/watch')
var getDirectory = require('path').dirname

module.exports = function (parentContext) {
  var context = Object.create(parentContext)
  var Setup = context.nodes.setup
  var clock = Clock(context.audio)
  var tempo = Observ(120)
  var speed = Observ(1)
  watch(tempo, clock.setTempo.bind(clock))
  watch(speed, clock.setSpeed.bind(clock))

  context.scheduler = clock
  context.tempo = tempo

  var lastPosition = 0
  var obs = Observ([])
  var setups = {}
  var positionChanging = false

  obs.position = Observ(0)
  obs.position(function (position) {
    if (!positionChanging) {
      allOff()
      clock.setPosition(position)
      lastPosition = 0
    }
  })

  obs.playing = Observ(false)
  obs.playing(function (value) {
    if (value) {
      clock.start()
    } else {
      allOff()
      clock.stop()
    }
  })

  obs(function(items) {
    items&&items.forEach(function(item) {
      if (item[1] === 'loadSetup' && !setups[item[3]]) {
        setups[item[3]] = getSetup(item[2])
      }
    })
  })

  obs.setups = setups

  clock.onSchedule(function (data) {
    var items = obs() || []

    // schedule in range
    while (items[lastPosition] && items[lastPosition][0] < data.to) {
      var item = items[lastPosition]
      if (item[1] === 'tempo') {
        tempo.set(item[2])
      } else if (items[lastPosition][0] >= data.from) {
        if (item[1] === 'trigger') {
          var setup = setups[item[2]]
          setup.context.triggerEvent({ 
            position: item[0], 
            id: item[3],
            event: item[4], 
            args: item[5],
            time: clock.getTimeAt(item[0])
          })
          if (item[4] === 'start') {
            setup.currentlyTriggering[item[3]] = true
          } else {
            delete setup.currentlyTriggering[item[3]]
          }
        }
      }

      lastPosition += 1
    }

    positionChanging = true
    obs.position.set(data.from)
    positionChanging = false

  })

  obs.destroy = function () {
    clock.stop()
    Object.keys(setups).forEach(function(id) {
      var setup = setups[id]
      setup.close()
      setup.destroy()
    })
    setups = {}
  }

  return obs

  // scoped

  function getSetup (path) {
    var subContext = Object.create(context)
    subContext.cwd = getDirectory(path)
    var file = context.project.getFile(path)
    var object = JsonFile(file)
    var setup = Setup(subContext)
    setup.close = object.destroy
    setup.currentlyTriggering = {}
    watch(object, setup.set)
    return setup
  }


  function allOff () {
    for (var k in setups) {
      var setup = setups[k]
      var currentlyTriggering = setup.currentlyTriggering
      for (var id in currentlyTriggering) {
        setup.context.triggerEvent({ 
          position: clock.getPositionAt(context.audio.currentTime), 
          id: id,
          event: 'stop', 
          time: context.audio.currentTime
        })
        delete currentlyTriggering[id]
      }
    }
  }
}