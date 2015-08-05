var OfflineClock = require('bopper/offline')
var JsonFile = require('loop-drop-project/json-file')
var Observ = require('observ')
var watch = require('observ/watch')
var getDirectory = require('path').dirname
var objectifyRecording = require('lib/objectify-recording')
var getTimeFromPosition = require('lib/time-from-position')

module.exports = function (parentContext) {

  var obs = Observ([])
  obs.progress = Observ(0)

  obs.render = function(cb) {

    var meta = objectifyRecording(obs())
    var duration = getTimeFromPosition(meta.end, meta.timeMapping)

    var tempo = Observ(120)
    var speed = Observ(1)
    var lastPosition = 0
    var setups = obs.setups = {}

    var sampleRate = parentContext.audio.sampleRate
    var context = Object.create(parentContext)
    context.audio = new OfflineAudioContext(2,sampleRate*duration,sampleRate)
    context.output = context.audio.createGain()
    context.output.connect(context.audio.destination)
    
    var clock = OfflineClock(context.audio)
    watch(tempo, clock.setTempo.bind(clock))
    watch(speed, clock.setSpeed.bind(clock))
    context.scheduler = clock
    context.tempo = tempo

    obs().forEach(function(item) {
      if (item[1] === 'loadSetup' && !setups[item[3]]) {
        setups[item[3]] = getSetup(context, item[2])
      }
    })

    setTimeout(function() { 
      // HACK: wait for setups to load
      buildGraph(duration, 0.1, function () {
        var progress = context.audio.createScriptProcessor(4096*2, 0, 1)
        progress.onaudioprocess = function(e) {
          obs.progress.set(0.1 + (context.audio.currentTime / duration) * 0.9)
        }
        progress.connect(context.audio.destination)
        context.audio.startRendering().then(function(renderedBuffer) {
          cleanUp()
          obs.progress.set(1)
          cb(null, renderedBuffer)
        }).catch(function(err) {
          cleanUp()
          cb&&cb(err)
        })
      })
    }, 2000)

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

    function cleanUp() {
      Object.keys(setups).forEach(function(id) {
        var setup = setups[id]
        setup.close()
        setup.destroy()
        obs.setups = {}
      })
    }

    clock.onSchedule(function (data) {
      var items = obs() || []
      // schedule in range
      while (items[lastPosition] && items[lastPosition][0] < data.to) {
        var item = items[lastPosition]
        if (item[1] === 'tempo') {
          tempo.set(item[2])
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

  }

  return obs
}

function getSetup (context, path) {
  var Setup = context.nodes.setup
  var subContext = Object.create(context)
  subContext.cwd = getDirectory(path)
  var file = context.project.getFile(path)
  var object = JsonFile(file)
  var setup = Setup(subContext)
  setup.close = object.destroy
  watch(object, setup.set)
  return setup
}