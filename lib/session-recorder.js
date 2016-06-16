var TimeStream = require('lib/time-stream')
var TimeOutputStream = require('lib/time-output-stream')
var ReadableBlobStream = require('readable-blob-stream')

var ObservStruct = require('observ-struct')
var Observ = require('observ')
var join = require('path').join
var mkdirp = require('mkdirp')
var strftime = require('strftime')

var resolveAvailable = require('lib/resolve-available')

const MB = 1024 * 1024

module.exports = SessionRecorder

function SessionRecorder (context) {
  var obs = ObservStruct({
    recording: Observ(false)
  })

  var minPreroll = 0.1 * MB
  var currentMediaRecorder = null

  var chunkDuration = 0.5
  var timeStream = TimeStream(context, {
    chunkDuration: chunkDuration
  })

  obs.input = context.audio.createMediaStreamDestination()

  var prerollPath = join(context.cwd, 'preroll.webm')
  var lastValue = false

  obs.recording(function (val) {
    if (val !== lastValue) {
      lastValue = val
      if (val) {
        startRecording()
      } else {
        stopRecording()
      }
    }
  })

  obs.recordingPath = Observ()

  switchOutput(prerollPath)
  return obs

  // scoped

  function startRecording () {
    var recordingsPath = join(context.cwd, '~recordings')
    var name = strftime('%F %H%M') // YY-MM-DD HHMM
    resolveAvailable(join(recordingsPath, name), context.fs, function (err, path) {
      if (err) throw err
      mkdirp(path, { fs: context.fs }, function (err) {
        if (err) throw err
        obs.recordingPath.set(path)
        var fileName = name + '.webm'
        var outputPath = join(path, fileName)
        var indexPath = join(path, 'index.json')
        switchOutput(outputPath, function () {
          //audioStream.setSilenceDuration(null)
          movePreroll(path, function (prerollFileName) {
            createRecording(indexPath, prerollFileName, fileName)
          })
        })
      })
    })
  }

  function stopRecording () {
    obs.recordingPath.set(null)
    switchOutput(prerollPath)
    // audioStream.setSilenceDuration(2)
  }

  function movePreroll (path, cb) {
    var fileName = 'preroll-' + strftime('%F %H%M') + '.webm'
    var filePath = join(path, fileName)
    context.fs.stat(prerollPath, function (err, stats) {
      if (!err && stats && stats.size > minPreroll) {
        context.fs.rename(prerollPath, filePath, function (err) {
          if (err) return cb && cb(null)
          context.fs.rename(prerollPath + '.time', filePath + '.time', function () {
            cb && cb(fileName)
          })
        })
      } else {
        cb && cb(null)
      }
    })
  }

  function createRecording (path, prerollFileName, fileName) {
    var clips = []

    if (prerollFileName) {
      clips.push({
        flags: ['preroll'],
        node: 'timeline/clip',
        src: './' + prerollFileName
      })
    }

    if (fileName) {
      clips.push({ node: 'timeline/clip', src: './' + fileName })
    }

    var data = JSON.stringify({
      node: 'recording',
      timeline: {
        node: 'timeline',
        primary: clips
      }
    })

    context.fs.writeFile(path, data, function () {
      // ensure refresh
      context.project.recordingEntries.refresh()
    })
  }

  function switchOutput (path, cb) {
    if (currentMediaRecorder) {
      currentMediaRecorder.cb = cb
      currentMediaRecorder.requestData()
      currentMediaRecorder.stop()
      currentMediaRecorder = null
    } else {
      cb && setImmediate(cb)
    }

    if (path) {
      var mediaRecorder = currentMediaRecorder = new window.MediaRecorder(obs.input.stream, { mimeType: 'audio/webm' })
      mediaRecorder.chunkCount = 0
      mediaRecorder.start(chunkDuration * 1000)

      var output = context.fs.createWriteStream(path)
      var timeOutput = TimeOutputStream(-timeStream.getCurrentTime())
      timeStream.pipe(timeOutput).pipe(context.fs.createWriteStream(path + '.time'))

      mediaRecorder.ondataavailable = function (e) {
        timeStream.add(mediaRecorder.chunkCount, true)
        mediaRecorder.chunkCount += 1
        ReadableBlobStream(e.data).pipe(output, {end: false})
      }

      mediaRecorder.onstop = function () {
        setTimeout(function () {
          if (mediaRecorder.cb) {
            output.on('finish', mediaRecorder.cb)
          }
          timeStream.unpipe(timeOutput)
          timeOutput.end()
          output.end()
        }, 200)
      }
    }
  }
}
