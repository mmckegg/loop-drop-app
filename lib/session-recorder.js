var WaveRecorder = require('wave-recorder')
var ObservStruct = require('observ-struct')
var Observ = require('observ')
var join = require('path').join

module.exports = SessionRecorder

function SessionRecorder(context) {

  var obs = ObservStruct({
    recording: Observ(false)
  })

  var recorders = []
  var lastValue = false
  var stopRecording = null
  var project = context.project

  obs.recording(function(val) {
    if (val !== lastValue) {

      stopRecording&&stopRecording()
      lastValue = val

      if (lastValue) {
        project.ensureDirectory('~recordings', function (err) {
          if (err) throw err

          var src = join('~recordings', 'Recording 1')
          project.resolveAvailable(src, function(err, src) {
            createRecording(src, function (err, path) {
              if (!err) {
                stopRecording = recordOutput(path)
              } else {
                throw err
              }
            })
          })

        })
      }

    }
  })

  return obs

  // scoped

  function recordOutput(path){
    console.log('recording output to', path)

    var fs = context.project._state.fs
    var stream = fs.createWriteStream(path)
    var chunkLength = 256

    var recorder = WaveRecorder(context.audio, {
      silenceDuration: 5, 
      startSilent: true,
      chunkLength: chunkLength,
      bitDepth: 32
    })

    recorder.pipe(stream)

    recorder.on('header', function(){
      //fs.write(path, recorder._header, 0, recorder._header.length, 0, noop)
    })

    recorders.push(recorder)
    context.output.connect(recorder.input)

    // time stamps
    var timeStream = fs.createWriteStream(path + '.time')
    var startAt = context.audio.currentTime
    var chunkDuration = chunkLength / context.audio.sampleRate
    var timeChunks = {}
    var timeOffset = 0
    var releaseSchedule = context.scheduler.onSchedule(function(data) {
      var from = Math.floor(data.from * 2) / 2
      var to = Math.floor(data.to * 2) / 2
      var hasCue = to - from
      if (hasCue) {
        var time = context.scheduler.getTimeAt(data.to) - startAt
        var chunk = Math.floor(time / chunkDuration)
        timeChunks[chunk] = time
      }
    })
    recorder.on('chunk', function(id, written) {
      if (written) {
        if (timeChunks[id] != null) {
          var data = floatBuffer(timeChunks[id] + timeOffset)
          timeStream.write(data)
        }
      } else {
        timeOffset -= chunkDuration
      }
    })

    return function stop(){
      recorder.end()
      timeStream.end()
      releaseSchedule()
      recorders.splice(recorders.indexOf(recorder, 1))
    }
  }

  function createRecording (src, cb) {
    var fs = project._state.fs 
    var fileName = Date.now() + '.wav'

    project.createDirectory(src, function (err) {
      
      var data = JSON.stringify({
        node: 'recording',
        timeline: { 
          node: 'timeline',
          primary: [
            { node: 'timeline/clip', src: './' + fileName }
          ]
        }
      })

      var path = project.resolve(src)
      fs.writeFile(join(path, 'index.json'), data, function (err) {
        if (err) return cb && cb(err)
        cb(null, join(path, fileName))
      })
    })
  }

  function ensureRecordingsDirectory () {
    project.exists
  }
}

function floatBuffer(value) {
  var buffer = new Buffer(4)
  buffer.writeFloatLE(value, 0)
  return buffer
}