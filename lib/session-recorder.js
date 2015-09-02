var WaveRecorder = require('wave-recorder')
var ObservStruct = require('observ-struct')
var Observ = require('observ')
var join = require('path').join

var resolveAvailable = require('lib/resolve-available')
var writeHeader = require('lib/write-header')

module.exports = SessionRecorder

function SessionRecorder(context) {

  var obs = ObservStruct({
    recording: Observ(false)
  })

  var recorders = []
  var lastValue = false
  var stopRecording = null

  obs.recording(function(val) {
    if (val !== lastValue) {

      stopRecording&&stopRecording()
      lastValue = val


      if (lastValue) {
        var recordingsPath = join(context.cwd, '~recordings')

        ensureDirectory(recordingsPath, context.fs, function (err) {
          if (err) throw err

          resolveAvailable(join(recordingsPath, 'Recording 1'), context.fs, function(err, path) {
            createRecording(path, function (err, outputPath) {
              if (!err) {
                // ensure refreshed!
                context.project.recordingEntries.refresh()
                stopRecording = recordOutput(outputPath)
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

    var stream = context.fs.createWriteStream(path)
    var chunkLength = 256

    var recorder = WaveRecorder(context.audio, {
      silenceDuration: 5,
      startSilent: true,
      chunkLength: chunkLength,
      bitDepth: 32
    })

    recorder.pipe(stream)


    recorder.on('header', function(header) {
      writeHeader(path, header, context.fs)
    })

    recorders.push(recorder)
    context.output.connect(recorder.input)

    // time stamps
    var timeStream = context.fs.createWriteStream(path + '.time')
    var startAt = context.audio.currentTime
    var chunkDuration = chunkLength / context.audio.sampleRate
    var timeChunks = {}
    var timeOffset = -0.02
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

  function createRecording (path, cb) {
    var fileName = Date.now() + '.wav'

    context.fs.mkdir(path, function (err) {
      if (err) return cb && cb(err)

      var data = JSON.stringify({
        node: 'recording',
        timeline: {
          node: 'timeline',
          primary: [
            { node: 'timeline/clip', src: './' + fileName }
          ]
        }
      })

      context.fs.writeFile(join(path, 'index.json'), data, function (err) {
        if (err) return cb && cb(err)
        cb(null, join(path, fileName))
      })
    })
  }
}

function floatBuffer(value) {
  var buffer = new Buffer(4)
  buffer.writeFloatLE(value, 0)
  return buffer
}

function noop () {}

function ensureDirectory(path, fs, cb) {
  fs.stat(path, function (err, stats) {
    if (err) {
      fs.mkdir(path, cb)
    } else {
      if (stats.isDirectory()) {
        cb && cb()
      } else {
        cb && cb(new Error('File exists: not a directory'))
      }
    }
  })
}
