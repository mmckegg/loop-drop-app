var watch = require('mutant/watch')
var computed = require('mutant/computed')
var Struct = require('mutant/struct')
var Value = require('mutant/value')
var join = require('path').join
var strftime = require('strftime')
var recordToDisk = require('lib/record-to-disk')
var mkdirp = require('mkdirp')
var each = require('async-each')
var getBaseName = require('path').basename
var getDirName = require('path').dirname
var getExt = require('path').extname

module.exports = SessionRecorder

function SessionRecorder (context, active) {
  var obs = Struct({
    recording: Value(false)
  })

  obs.recordPosition = Value(null)

  obs.input = context.audio.createGain() // context.audio.createMediaStreamDestination()
  obs.recordingPath = Value(null)

  // constant signal to ensure file has no gaps
  Silence(context.audio).connect(obs.input)

  var recordingsPath = join(context.cwd, '~recordings')
  mkdirp(recordingsPath, { fs: context.fs })

  var isRecording = computed([obs.recording, active], (a, b) => a || b)
  var storing = computed(obs.recording, a => a)
  var currentRecordingPath = null

  var clips = []
  var releases = []

  watch(isRecording, refreshRecording)

  watch(storing, function (value) {
    if (currentRecordingPath) {
      obs.recordingPath.set(null)
      moveClipsToTimeline(currentRecordingPath)
      currentRecordingPath = null
    }

    if (value) {
      currentRecordingPath = join(recordingsPath, strftime('%F %H%M%S'))
      mkdirp(currentRecordingPath, { fs: context.fs }, function () {
        context.project.recordingEntries.refresh()
        obs.recordingPath.set(currentRecordingPath)
      })
    }
  })

  obs.cleanUpOldClips = function (maxTime, cb) {
    context.fs.readdir(recordingsPath, function (err, fileNames) {
      if (err) return cb && cb(err)
      var paths = fileNames.filter(x => getExt(x) === '.json').map(name => join(recordingsPath, name))
      each(paths, function (path, next) {
        context.fs.readFile(path, 'utf8', function (err, result) {
          if (err) return next(err)
          result = JSON.parse(result)
          result.path = path
          next(null, result)
        })
      }, function (err, files) {
        if (err) return cb && cb(err)
        var toDelete = []
        var collectedDuation = 0
        files.sort((a, b) => b.recordedAt - a.recordedAt)
        for (var i = 0; i < files.length; i++) {
          if (collectedDuation > maxTime || files[i].duration < 5) {
            toDelete.push(files[i])
          }
          collectedDuation += files[i].duration
        }

        each(toDelete, function (file, next) {
          console.log('removing old preroll', file.path)
          var base = getDirName(file.path)
          context.fs.unlink(file.path + '.time')
          context.fs.unlink(file.path, function (err) {
            if (err) next(err)
            each(file.segments, function (segment, next) {
              context.fs.unlink(join(base, segment.src), next)
            }, next)
          })
        }, cb)
      })
    })
  }

  obs.stop = function (cb) {
    if (isRecording()) {
      if (storing()) {
        moveClipsToTimeline(currentRecordingPath, cb)
      } else {
        stopRecording(cb)
      }
    } else {
      setImmediate(cb)
    }
  }

  obs.context = context
  return obs

  function moveClipsToTimeline (path, cb) {
    moveClips(path, function (err, fileNames) {
      if (err) throw err
      var data = {
        node: 'recording',
        timeline: {
          node: 'timeline',
          primary: getClips(fileNames)
        }
      }
      context.fs.writeFile(join(path, 'index.json'), JSON.stringify(data), cb)
    })
  }

  function refreshRecording () {
    stopRecording()
    if (isRecording()) {
      var path = join(recordingsPath, strftime('%F %H%M%S') + '.json')
      clips.push(path)
      obs.recordPosition.set(0)
      releases.push(
        recordToDisk(path, obs.input, onTick),
        writeTimeCodeToDisk(context, path + '.time')
      )
    }
  }

  function onTick (pos) {
    obs.recordPosition.set(pos)
  }

  function moveClips (basePath, cb) {
    stopRecording(function () {
      var lists = clips.slice()
      clips.length = 0

      each(lists, function (path, next) {
        var fileName = getBaseName(path)
        var newPath = join(basePath, fileName)
        moveList(context.fs, path, basePath, function (err) {
          if (err) return cb(err)
          context.fs.rename(path + '.time', newPath + '.time', function (discardError) {
            next(null, fileName)
          })
        })
      }, cb)

      // restart recording process
      refreshRecording()
    })
  }

  function stopRecording (cb) {
    each(releases.slice(), (fn, next) => fn(next), cb)
    obs.recordPosition.set(null)
    releases.length = 0
  }
}

function getClips (fileNames) {
  var last = fileNames[fileNames.length - 1]
  return fileNames.map(function (fileName) {
    if (fileName === last) {
      return {
        node: 'timeline/clip',
        src: './' + fileName
      }
    } else {
      return {
        flags: ['preroll'],
        node: 'timeline/clip',
        src: './' + fileName
      }
    }
  })
}

function Silence (audioContext) {
  var buffer = audioContext.createBuffer(2, 2, audioContext.sampleRate)
  var player = audioContext.createBufferSource()
  player.buffer = buffer
  player.loop = true
  player.start()
  return player
}

function writeTimeCodeToDisk (context, filePath) {
  // time stamps
  var output = context.fs.createWriteStream(filePath)
  var startAt = context.audio.currentTime
  var timeOffset = -0.012
  var releaseSchedule = context.scheduler.onSchedule(function (data) {
    var from = Math.floor(data.from * 2) / 2
    var to = Math.floor(data.to * 2) / 2
    var hasCue = to - from
    if (hasCue) {
      var time = context.scheduler.getTimeAt(to) - startAt
      output.write(floatBuffer(time + timeOffset))
    }
  })

  return function (cb) {
    releaseSchedule()
    if (cb) {
      output.on('finish', cb)
    }
    output.end()
  }
}

function floatBuffer (value) {
  var buffer = new Buffer(4)
  buffer.writeFloatLE(value, 0)
  return buffer
}

function moveList (fs, path, to, cb) {
  var basePath = getDirName(path)
  var file = getBaseName(path)
  var newPath = join(to, file)
  fs.readFile(path, 'utf8', function (err, result) {
    if (err) return cb(err)
    var data = JSON.parse(result)
    var files = data.segments.map(function (segment) {
      return segment.src
    })
    fs.rename(path, newPath, function (err) {
      if (err) return cb(err)
      each(files, function (file, next) {
        var oldPath = join(basePath, file)
        var newPath = join(to, file)
        fs.rename(oldPath, newPath, next)
      }, cb)
    })
  })
}
