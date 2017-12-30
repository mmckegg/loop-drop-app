var Path = require('path')
var Value = require('mutant/value')
var resolve = require('mutant/resolve')
var watch = require('mutant/watch')
var computed = require('mutant/computed')
var Collection = require('mutant/array')
var template = require('./template.js')
var WaveFileWriter = require('lib/wave-file-writer')
var toStream = require('pull-stream-to-stream')
var pull = require('pull-stream')
var StreamProgress = require('lib/stream-progress')

module.exports = function (timeline, outputPath, cb) {
  var primaryClips = []
  var lastTrackId = 8
  var tracks = [{
    clips: primaryClips,
    id: lastTrackId++
  }]
  var tempoEvents = []
  var tempo = 0
  var currentDuration = 0
  var toExport = []
  var dir = Path.dirname(outputPath)
  var ext = Path.extname(outputPath)
  var base = Path.basename(outputPath, ext)
  var projectPath = Path.join(dir, `${base} Project`)
  var setPath = Path.join(projectPath, `${base}${ext}`)
  var progressElements = Collection([])
  var progress = computed([progressElements], values => {
    return values.reduce((a, b) => a + b) / values.length
  })

  timeline.primary.forEach(primaryClip => {
    if (resolve(primaryClip.resolved.duration)) {
      var fileName = Path.basename(resolve(primaryClip.src), '.json') + '.wav'
      var name = Path.basename(fileName, Path.extname(fileName))
      var warpMarkers = primaryClip.getWarpMarkers()
      var start = 0
      var end = resolve(primaryClip.cuePoints).length / 2

      primaryClips.push({
        name, fileName, start, end, warpMarkers, at: currentDuration, isTempoMaster: true
      })
      warpMarkers.forEach(marker => {
        if (!tempo) tempo = marker.tempo
        tempoEvents.push({
          time: marker.beat + currentDuration,
          tempo: marker.tempo
        })
      })
      var p = Value(0)
      progressElements.push(p)
      toExport.push({
        clip: primaryClip, outputPath: Path.join(projectPath, fileName), onProgress: p.set
      })

      var linked = timeline.secondary.getLinkedTo(resolve(primaryClip.id))
      linked.forEach(clip => {
        var clips = []
        tracks.push({
          id: lastTrackId++,
          clips: clips
        })
        var fileName = Path.basename(resolve(clip.src), '.json') + '.wav'
        var name = Path.basename(fileName, Path.extname(fileName))
        var warpMarkers = clip.getWarpMarkers(clip.startOffset())
        var start = 0
        var end = resolve(clip.cuePoints).length / 2
        clips.push({
          name, fileName, start, end, warpMarkers, at: currentDuration, isTempoMaster: false
        })
        var p = Value(0)
        progressElements.push(p)
        toExport.push({
          clip, outputPath: Path.join(projectPath, fileName), onProgress: p.set
        })
      })

      currentDuration += end - start
    }
  })

  fs.mkdir(projectPath, (err) => {
    if (err) return cb && cb(err)
    addProjectInfo(projectPath, (err) => {
      if (err) return cb && cb(err)
      forEach(toExport, exportClip, (err) => {
        if (err) return cb && cb(err)
        var setContent = template({
          tracks, tempo, tempoEvents
        })
        fs.writeFile(setPath, setContent, cb)
      })
    })
  })

  return progress
}

function exportClip ({clip, outputPath, onProgress}, cb) {
  var bitDepth = resolve(clip.resolved.bitDepth)
  var sampleRate = resolve(clip.resolved.sampleRate)
  var duration = resolve(clip.resolved.duration)
  var progressWatcher = StreamProgress({duration, sampleRate})

  var source = pull(
    clip.pull(),
    progressWatcher
  )

  var output = WaveFileWriter(outputPath, {
    bitDepth: bitDepth,
    format: bitDepth === 32 ? 3 : 1,
    sampleRate: resolve(clip.resolved.sampleRate),
    channels: resolve(clip.resolved.channels)
  })

  toStream.source(source).pipe(output).on('finish', cb).on('error', cb)
  watch(progressWatcher.value, onProgress)
}

function forEach (array, fn, cb) {
  var i = -1
  function next (err) {
    if (err) return cb && cb(err)
    i += 1
    if (i < array.length) {
      fn(array[i], next, i)
    } else {
      cb && cb(null)
    }
  }
  next()
}

function addProjectInfo (project, cb) {
  var dir = Path.join(project, 'Ableton Project Info')
  var from = Path.join(__dirname, 'Project8_1.cfg')
  var to = Path.join(dir, 'Project8_1.cfg')
  fs.mkdir(dir, (err) => {
    if (err) return cb && cb(err)
    fs.createReadStream(from).pipe(fs.createWriteStream(to)).on('finish', cb).on('error', cb)
  })
}
