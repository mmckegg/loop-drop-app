var Clock = require('bopper')
var JsonFile = require('loop-drop-project/json-file')
var Observ = require('observ')
var watch = require('observ/watch')
var getDirectory = require('path').dirname

module.exports = function (parentContext) {
  var context = Object.create(parentContext)
  var Setup = context.nodes.setup
  var clock = Clock(context.audio)

  context.scheduler = clock

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

  obs.setups = setups

  clock.onSchedule(function (data) {
    var items = obs() || []
    var loadSetups = {}

    // scan to current position
    while (items[lastPosition] && items[lastPosition][0] < data.from) {
      var item = items[lastPosition]
      if (item[1] === 'loadSetup') {
        loadSetups[item[3]] = item[2]
      } else if (item[1] === 'closeSetup') {
        delete loadSetups[item[3]]
      } else if (item[1] === 'tempo') {
        context.tempo.set(item[2])
      }
      lastPosition += 1
    }

    // load any needed setups
    for (var k in loadSetups) {
      if (!setups[k]) {
        setups[k] = getSetup(loadSetups[k])
      }
    }

    // schedule in range
    while (items[lastPosition] && items[lastPosition][0] < data.to) {
      var item = items[lastPosition]
      if (item[1] === 'tempo') {
        context.tempo.set(item[2])
      } else if (item[1] === 'loadSetup' && !setups[item[3]]) {
        setups[item[3]] = getSetup(item[2])
      } else if (item[1] === 'closeSetup' && setups[item[2]]) {
        setups[item[2]].close()
        delete setups[item[2]]
      } else if (item[1] === 'trigger') {
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
      lastPosition += 1
    }

    positionChanging = true
    obs.position.set(data.from)
    positionChanging = false

  })

  return obs

  // scoped

  function getSetup (path) {
    var subContext = Object.create(context)
    subContext.cwd = getDirectory(path)
    var file = context.project.getFile(path)
    var object = JsonFile(file)
    var setup = Setup(subContext)
    setup.close = file.close
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