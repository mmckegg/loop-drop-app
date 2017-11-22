var WaveFileWriter = require('wav/lib/file-writer')
var fs = require('fs')
var join = require('path').join
var getExt = require('path').extname
var getBaseName = require('path').basename
var getDirName = require('path').dirname

module.exports = SegmentedWaveWriter

function SegmentedWaveWriter (outputFile, opts, onDone) {
  var maxChunks = opts.segmentLength || 64
  var ext = getExt(outputFile)
  var base = getBaseName(outputFile, ext)
  var dir = getDirName(outputFile)

  var outputInfo = {
    sampleRate: opts.sampleRate,
    recordedAt: Date.now(),
    duration: 0,
    channels: opts.channels,
    segments: []
  }

  var count = 0
  var segmentCount = 0
  var currentWriter = null

  var result = {
    write: function (buffer) {
      write(null, buffer)
    },
    end: function (buffer) {
      write(true, buffer)
    }
  }

  writeOutputInfo()

  return result

  // scoped

  function write (ended, buffer) {
    if (count === 0) {
      var fileName = `${base}-${padded(segmentCount)}.wav`
      currentWriter = WaveFileWriter(join(dir, fileName), opts)
      currentWriter.on('done', function () {
        var block = this.channels * this.bitDepth / 8
        outputInfo.segments.push({
          src: `./${fileName}`,
          duration: this.dataLength / this.sampleRate / block
        })
        outputInfo.duration = outputInfo.segments.reduce((r, s) => r + s.duration, 0)
        if (!ended) {
          writeOutputInfo()
        }
      })
    }
    if (ended) {
      currentWriter.on('done', function () {
        writeOutputInfo(onDone)
      })
      currentWriter.end(buffer)
    } else {
      currentWriter.write(buffer)
    }
    count += 1
    if (!ended && count >= maxChunks) {
      currentWriter.end()
      segmentCount += 1
      count = 0
    }
  }

  function writeOutputInfo (cb) {
    fs.writeFile(outputFile, JSON.stringify(outputInfo), cb)
  }
}

function padded (val) {
  if (val < 1000) {
    return ('00' + Math.round(val)).slice(-3)
  } else {
    return String(val)
  }
}
