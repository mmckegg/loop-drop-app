var WaveStream = require('wav/lib/writer')
var TimeStream = require('lib/time-stream')
var TimeOutputStream = require('lib/time-output-stream')
var AudioBufferStream = require('audio-buffer-stream')

var ObservStruct = require('observ-struct')
var Observ = require('observ')
var join = require('path').join
var mkdirp = require('mkdirp')

var resolveAvailable = require('lib/resolve-available')
var writeHeader = require('lib/write-header')

const MB = 1024 * 1024

module.exports = SessionRecorder

function SessionRecorder (context) {
  var obs = ObservStruct({
    recording: Observ(false)
  })

  var chunkLength = 256
  var minPreroll = 2 * MB

  var audioStream = AudioBufferStream({
    sampleRate: context.audio.sampleRate,
    silenceDuration: 2, // disabled when recording
    chunkLength: chunkLength,
    channels: 2,
    bitDepth: 32
  })

  var timeStream = TimeStream(context, audioStream, {
    chunkLength: chunkLength
  })

  obs.input = context.audio.createScriptProcessor(4096)
  obs.input.connect(context.audio.destination)
  obs.input.onaudioprocess = function (e) {
    audioStream.write(e.inputBuffer)
  }

  var prerollWavPath = join(context.cwd, 'preroll.wav')
  var currentOutput = null
  var currentTimeOutput = null
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

  switchOutput(prerollWavPath)
  return obs

  // scoped

  function startRecording () {
    var recordingsPath = join(context.cwd, '~recordings')
    resolveAvailable(join(recordingsPath, 'Recording 1'), context.fs, function (err, path) {
      if (err) throw err
      mkdirp(path, { fs: context.fs }, function (err) {
        if (err) throw err
        var fileName = Date.now() + '.wav'
        var wavePath = join(path, fileName)
        var indexPath = join(path, 'index.json')
        switchOutput(wavePath, function () {
          audioStream.setSilenceDuration(null)
          movePreroll(path, function (prerollFileName) {
            createRecording(indexPath, prerollFileName, fileName)
          })
        })
      })
    })
  }

  function stopRecording () {
    switchOutput(prerollWavPath)
    audioStream.setSilenceDuration(2)
  }

  function movePreroll (path, cb) {
    var fileName = 'preroll-' + Date.now() + '.wav'
    var filePath = join(path, fileName)
    context.fs.stat(prerollWavPath, function (err, stats) {
      if (!err && stats && stats.size > minPreroll) {
        context.fs.rename(prerollWavPath, filePath, function (err) {
          if (err) return cb && cb(null)
          context.fs.rename(prerollWavPath + '.time', filePath + '.time', function () {
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
    if (currentOutput) {
      if (cb) {
        currentOutput.on('finish', cb)
      }
      audioStream.unpipe(currentOutput)
      timeStream.unpipe(currentTimeOutput)
      currentOutput.end()
      currentTimeOutput.end()
    } else {
      cb && setImmediate(cb)
    }

    if (path) {
      var output = context.fs.createWriteStream(path)
      var timeOutput = context.fs.createWriteStream(path + '.time')
      currentTimeOutput = TimeOutputStream(-timeStream.getCurrentTime())
      currentOutput = WaveStream({
        sampleRate: context.sampleRate,
        bitDepth: 32,
        channels: 2,
        format: 3
      })
      currentOutput.on('header', function (header) {
        writeHeader(path, header, context.fs)
      })
      timeStream.pipe(currentTimeOutput).pipe(timeOutput)
      audioStream.pipe(currentOutput).pipe(output)
    }
  }
}
