var ReadableBlobStream = require('readable-blob-stream')
var spawn = require('child_process').spawn
var fs = require('fs')
var join = require('path').join
var getExt = require('path').extname
var getBaseName = require('path').basename
var getDirName = require('path').dirname
var ffmpeg = join(__dirname, '..', 'bin', 'ffmpeg-' + process.platform)

if (process.platform === 'win32') {
  ffmpeg += '.exe'
}

module.exports = recordToDisk

function recordToDisk (path, mediaStream) {
  var chunkDuration = 0.5 // seconds
  var mediaRecorder = new window.MediaRecorder(mediaStream, { mimeType: 'audio/webm' })
  var onFinish = null
  mediaRecorder.chunkCount = 0
  mediaRecorder.start(chunkDuration * 1000)

  var output = WaveWriter(path, function () {
    if (onFinish) {
      onFinish.apply(this, arguments)
    }
  })

  mediaRecorder.ondataavailable = function (e) {
    mediaRecorder.chunkCount += 1
    var stream = ReadableBlobStream(e.data)
    stream.pipe(output, {end: false})
  }

  return function stopRecording (cb) {
    onFinish = cb
    mediaRecorder.requestData()
    mediaRecorder.stop()

    setTimeout(function () {
      output.end()
    }, 200)
  }
}

function WaveWriter (outputFile, onDone) {
  var ext = getExt(outputFile)
  var base = getBaseName(outputFile, ext)
  var dir = getDirName(outputFile)
  var segmentLength = 30

  var outputInfo = {
    sampleRate: 48000,
    recordedAt: Date.now(),
    duration: 0,
    channels: 2,
    segments: []
  }

  writeOutputInfo()

  var child = spawn(ffmpeg, [
    '-i', '-',
    '-acodec', 'pcm_f32le',
    '-f', 'segment',
    '-segment_list', 'pipe:1',
    '-segment_list_type', 'csv',
    '-segment_time', segmentLength,
    join(dir, base + '-%05d.wav')
  ])

  child.stderr.on('data', function (c) {
    // release the pressure!
  })

  child.stdout.on('data', function (data) {
    if (outputInfo.segments.length) {
      // ensure correct segment length time
      outputInfo.segments[outputInfo.segments.length - 1].duration = segmentLength
    }
    var parts = data.toString().trim().split(',')
    var duration = parseFloat(parts[2]) - parseFloat(parts[1])
    outputInfo.segments.push({src: './' + parts[0], duration: duration})
    outputInfo.duration = outputInfo.segments.reduce((r, s) => r + s.duration, 0)
    writeOutputInfo()
  })

  if (onDone) {
    child.on('exit', function (code) {
      if (code === 0) {
        setTimeout(function () {
          onDone(null, outputInfo)
        }, 50)
      } else {
        onDone(new Error('Recording error'))
      }
    })
  }

  return child.stdin

  // scoped

  function writeOutputInfo () {
    fs.writeFile(outputFile, JSON.stringify(outputInfo))
  }
}
