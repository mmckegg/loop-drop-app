var OfflineClock = require('bopper/offline')
var JsonFile = require('loop-drop-project/json-file')
var Observ = require('observ')
var watch = require('observ/watch')
var getDirectory = require('path').dirname

module.exports = function (parentContext) {
  var context = Object.create(parentContext)
  var totalTime = 40
  context.audio = new OfflineAudioContext(2,44100*totalTime,44100)
  context.output = context.audio.createGain()
  context.output.connect(context.audio.destination)

  var Setup = context.nodes.setup
  var clock = OfflineClock(context.audio)

  context.scheduler = clock

  var lastPosition = 0
  var obs = Observ([])
  var setups = {}

  obs(function(items) {
    items.forEach(function(item) {
      if (item[1] === 'loadSetup' && !setups[item[3]]) {
        setups[item[3]] = getSetup(item[2])
      }
    })
  })

  obs.progress = Observ(0)

  obs.render = function(cb) {
    buildGraph(totalTime, 1, function () {
      var progress = context.audio.createScriptProcessor(4096*2, 0, 1)
      progress.onaudioprocess = function(e) {
        obs.progress.set(0.1 + (context.audio.currentTime / totalTime) * 0.9)
      }
      progress.connect(context.audio.destination)
      context.audio.startRendering().then(function(renderedBuffer) {
        obs.progress.set(1)
        cb(null, renderedBuffer)
        obs.destroy()
      }).catch(function(err) {
        cb&&cb(err)
        obs.destroy()
      })
    })
  }

  obs.destroy = function () {
    Object.keys(setups).forEach(function(id) {
      var setup = setups[id]
      setup.destroy()
    })
    setups = {}
  }

  function buildGraph (duration, block, cb) {
    schedule()

    function schedule () {
      clock.schedule(block)
      obs.progress.set(clock.currentTime / duration * 0.1)
      if (clock.currentTime < duration) {
        process.nextTick(schedule)
      } else {
        cb()
      }
    }
  }

  obs.setups = setups

  clock.onSchedule(function (data) {
    var items = obs() || []
    // schedule in range
    while (items[lastPosition] && items[lastPosition][0] < data.to) {
      var item = items[lastPosition]
      if (item[1] === 'tempo') {
        context.tempo.set(item[2])
      } else if (item[1] === 'trigger') {
        var setup = setups[item[2]]
        setup.context.triggerEvent({ 
          position: item[0], 
          id: item[3],
          event: item[4], 
          args: item[5],
          time: clock.getTimeAt(item[0])
        })
      }
      lastPosition += 1
    }
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
    watch(object, setup.set)
    return setup
  }

}