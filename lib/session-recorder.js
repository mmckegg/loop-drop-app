var watch = require('mutant/watch')
var computed = require('mutant/computed')
var Struct = require('mutant/struct')
var Value = require('mutant/value')
var resolve = require('mutant/resolve')
var join = require('path').join
var strftime = require('strftime')
var recordToDisk = require('lib/record-to-disk')
var mkdirp = require('mkdirp')
var each = require('async-each')
var getBaseName = require('path').basename
var getDirName = require('path').dirname
var getExt = require('path').extname

module.exports = SessionRecorder

function SessionRecorder (context, {active, externalInputs}) {
  var obs = Struct({
    recording: Value(false)
  })

  obs.recordPosition = Value(null)

  obs.input = context.audio.createGain() // context.audio.createMediaStreamDestination()
  obs.recordingPath = Value(null)

  // constant signal to ensure file has no gaps
  Silence(context.audio).connect(obs.input)

  var recordingsPath = join(resolve(context.cwd), '~recordings')
  mkdirp(recordingsPath, { fs: context.fs })

  var isRecording = computed([obs.recording, active], (a, b) => a || b)
  var storing = computed(obs.recording, a => a)
  var currentRecordingPath = null

  var primaryClips = []
  var secondaryClips = []
  var releases = []

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

  watch(isRecording, refreshRecording)

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
    moveClips(path, function (err, tracks) {
      if (err) throw err
      var data = {
        node: 'recording',
        timeline: {
          node: 'timeline',
          primary: tracks.primary,
          secondary: tracks.secondary
        }
      }
      context.fs.writeFile(join(path, 'index.json'), JSON.stringify(data), cb)
    })
  }

  function refreshRecording () {
    stopRecording()
    if (isRecording()) {
      obs.recordPosition.set(0)

      var id = strftime('%F %H%M%S')
      var fileName = id + '.json'
      var path = join(recordingsPath, fileName)
      primaryClips.push({
        id,
        node: 'timeline/clip',
        src: './' + fileName
      })

      var nodesToRecord = {
        [path]: obs.input
      }

      var externalPaths = []

      resolve(externalInputs || []).forEach((input, i) => {
        var externalFileName = id + '-' + (i + 1) + '.json'
        var externalPath = join(recordingsPath, externalFileName)
        externalPaths.push(externalPath)
        secondaryClips.push({
          linkTo: id,
          node: 'timeline/clip',
          startOffset: context.audio.baseLatency, // adjust for latency
          src: './' + externalFileName
        })
        nodesToRecord[externalPath] = input
      })

      releases.push(
        recordToDisk(context.audio, nodesToRecord, (startTime) => {
          releases.push(writeTimeCodeToDisk(context, path + '.time', startTime))
          externalPaths.forEach(path => {
            releases.push(writeTimeCodeToDisk(context, path + '.time', startTime))
          })
        }, onTick)
      )
    }
  }

  function onTick (pos) {
    obs.recordPosition.set(pos)
  }

  function moveClips (basePath, cb) {
    stopRecording(function () {
      var primary = primaryClips.slice()
      var secondary = secondaryClips.slice()
      primaryClips.length = 0
      secondaryClips.length = 0

      var toMove = primary.concat(secondary).map(x => join(recordingsPath, x.src))

      each(toMove, function (path, next) {
        var fileName = getBaseName(path)
        var newPath = join(basePath, fileName)
        moveList(context.fs, path, basePath, function (err) {
          if (err) return cb(err)
          context.fs.rename(path + '.time', newPath + '.time', function (discardError) {
            next(null, fileName)
          })
        })
      }, (err) => {
        if (err) return cb && cb(err)
        cb && cb(null, {primary, secondary})
      })

      // restart recording process
      refreshRecording()
    })
  }

  function stopRecording (cb) {
    obs.recordPosition.set(null)
    var toRelease = releases.length
    while (releases.length) {
      releases.pop()(() => {
        toRelease -= 1
        if (!toRelease && cb) {
          cb()
          cb = null
        }
      })
    }
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

function writeTimeCodeToDisk (context, filePath, startTime) {
  // time stamps
  var output = context.fs.createWriteStream(filePath)
  var startAt = context.audio.currentTime
  var timeOffset = context.audio.currentTime - startTime
  var waitingForStartBeat = true
  var releaseSchedule = context.scheduler.onSchedule(function (data) {
    var from = Math.floor(data.from * 2) / 2
    var to = Math.floor(data.to * 2) / 2
    var hasCue = to - from

    // ensure start on beat
    if (hasCue && (!waitingForStartBeat || Math.floor(to) === to)) {
      waitingForStartBeat = false
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
