var Observ = require('observ')
var Property = require('observ-default')
var NodeArray = require('observ-node-array')
var ObservArray = require('observ-array')
var ObservStruct = require('observ-struct')
var ObservVarhash = require('observ-varhash')
var watch = require('observ/watch')
var computed = require('observ/computed')
var Event = require('geval')

var TapTempo = require('tap-tempo')
var Bopper = require('bopper')
var AudioRMS = require('audio-rms')

var ObservDirectory = require('observ-fs/directory')
var FileObject = require('lib/file-object')
var QueryParam = require('lib/query-param')
var findItemByPath = require('lib/find-item-by-path')
var SessionRecorder = require('lib/session-recorder')
var StreamObserv = require('lib/stream-observ')

var getDirectory = require('path').dirname
var getExt = require('path').extname
var getBaseName = require('path').basename
var join = require('path').join
var extend = require('xtend')
var resolve = require('path').resolve
var resolveAvailable = require('lib/resolve-available')

var copyFile = require('lib/copy-file')
var rimraf = require('rimraf')

var scrollIntoView = require('scroll-into-view')

module.exports = Project

function Project (parentContext) {

  var context = Object.create(parentContext)
  var recorder = SessionRecorder(context)

  // main output and monitoring
  var output = context.audio.createDynamicsCompressor()
  output.ratio.value = 20
  output.threshold.value = -1
  output.rms = AudioRMS(context.audio)
  output.connect(output.rms.input)
  output.connect(context.audio.destination)
  context.output = output

  // main clock
  var scheduler = Bopper(context.audio)
  scheduler.start()
  context.scheduler = scheduler

  context.paramLookup = ObservVarhash({})

  var obs = ObservStruct({
    zoom: parentContext.zoom,
    tempo: Property(120),
    swing: Property(0),
    rawMode: Property(false),
    globalControllers: NodeArray(context)
  })

  obs.context = context

  obs.speed = Observ(1)
  obs.selected = Observ()
  obs.renaming = Observ(false)
  obs.entries = ObservDirectory(context.cwd, context.fs)
  obs.recording = recorder.recording
  obs.recordingEntries = ObservDirectory(resolve(context.cwd, '~recordings'), context.fs)
  obs.subEntries = ObservVarhash({})
  obs.outputRms = StreamObserv(output.rms)

  obs.availableGlobalControllers = computed([context.midiPorts], function (portNames) {
    var result = []
    var controllers = context.nodeInfo.groupLookup['global-controllers']
    if (controllers) {
      controllers.forEach(function (info) {
        if (info.portMatch && matchAny(portNames, info.portMatch)) {
          result.push({
            name: info.name,
            node: info.node
          })
        }
      })
    }
    return result
  })

  // apply tempo
  watch(obs.tempo, scheduler.setTempo.bind(scheduler))
  watch(obs.speed, scheduler.setSpeed.bind(scheduler))

  var broadcastItemLoaded = null
  obs.items = ObservArray([])
  obs.items.onLoad = Event(function(broadcast) { 
    broadcastItemLoaded = broadcast 
  })

  obs.resolved = ObservStruct({
    items: obs.items,
    renaming: obs.renaming,
    entries: obs.entries,
    recording: obs.recording,
    recordingEntries: obs.recordingEntries,
    subEntries: obs.subEntries,
    availableGlobalControllers: obs.availableGlobalControllers,
    selected: obs.selected
  })

  var tapTempo = TapTempo()
  tapTempo.on('tempo', function (value) {
    obs.tempo.set(Math.round(value))
  })

  var chunkScroller = null
  var actions = obs.actions = {
    open: function (path) {
      var ext = getExt(path)
      if (!ext){
        path = join(path, 'index.json')
      }

      var current = findItemByPath(obs.items, path)

      if (!current){
        current = actions.addFileObject(path)
      }

      obs.selected.set(path)
    },

    tapTempo: function () {
      tapTempo.tap()
    },

    closeFile: function (path) {
      var object = findItemByPath(obs.items, path)
      if (object){
        object.close()
      }
    },

    toggleDirectory: function (path) {
      var directory = obs.subEntries.get(path)
      if (directory){
        obs.subEntries.put(path, null)
        directory.close()
      } else {
        obs.subEntries.put(path, ObservDirectory(path, context.fs))
      }
    },

    newSetup: function () {
      var path = join(context.cwd, 'New Setup')
      resolveAvailable(path, context.fs, function (err, path) {
        context.fs.mkdir(path, function (err) {
          if (err) throw err
          var setupPath = join(path, 'index.json')
          context.fs.writeFile(setupPath, JSON.stringify({node: 'setup'}), function (err) {
            if (err) throw err
            var setup = actions.addFileObject(setupPath)
            obs.selected.set(setupPath)
            obs.renaming.set(true)
          })
        })
      })
    },

    rename: function (path, newName, cb) {
      var ext = getExt(path)
      var filePath = ext ? path : join(path, 'index.json')

      var newPath = join(getDirectory(path), newName)
      var newFilePath = ext ? newPath : join(newPath, 'index.json')

      var isSelected = path === obs.selected() || filePath === obs.selected()

      resolveAvailable(newPath, context.fs, function (err, newPath) {
        if (err) return cb&&cb(err)
        context.fs.rename(path, newPath, function (err) {
          if (err) return cb&&cb(err)
          var item = findItemByPath(obs.items, filePath)
          if (item){
            item.load(newFilePath)
            if (isSelected){
              obs.selected.set(item.path)
            }
          }
          cb&&cb()
        })
      })

    },

    deleteEntry: function (path, cb) {
      rimraf(path, context.fs, cb || function(err) { 
        if (err) throw err
      })
    },

    importChunk: function (path, cwd, cb) {
      var baseName = getBaseName(path)
      var targetPath = join(cwd, baseName)

      resolveAvailable(targetPath, context.fs, function(err, toPath) {
        copyExternalFilesTo(context.fs, path, cwd)
        copyFile(path, toPath, context.fs, function(err){
          if (cb) {
            if (err) return cb(err)
            cb(null, toPath)
          }
        })
      })
    },

    updateChunkReferences: function (chunkId, newChunkId, chunk) {
      var setup = chunk.context.setup
      var fileObject = chunk.context.fileObject
      var descriptor = chunk()

      setup.updateChunkReferences(chunkId, newChunkId)

      if (chunk._type === 'ExternalNode' && descriptor.src) {

        // only rename if old file matches ID
        var oldSrc = chunkId + '.json'
        var newSrc = newChunkId + '.json'
        if (oldSrc === join(descriptor.src)) {
          var path = fileObject.resolvePath(oldSrc)
          actions.rename(path, newChunkId + '.json', function(){
            QueryParam(chunk, 'src').set(newSrc)
          })
        }

      }
    },

    scrollToSelected: function(){
      setTimeout(function(){
        var el = document.querySelector('.SetupsBrowser .-selected, .ChunksBrowser .-selected')
        el && el.scrollIntoViewIfNeeded()
      }, 10)
    },

    scrollToSelectedChunk: function() {
      clearTimeout(chunkScroller)
      chunkScroller = setTimeout(function(){
        var el = document.querySelector('.ExternalNode.-selected')
        if (el) {
          scrollIntoView(el, { time: 200 })
        }
      }, 200)
    },

    grabInputForSelected: function(){
      var item = lastSelected
      if (item && item.node && item.node.grabInput){
        item.node.grabInput()
      }
    },

    addFileObject: function (path) {

      var object = FileObject(context)

      // HACK: avoid audio glitches by scheduling 1 second ahead
      scheduler.schedule(1)

      object.onLoad(function () {

        broadcastItemLoaded(object)

        // don't backup a corrupted file!
        //if (Object.keys(object() || {}).length){
        //  project.backup(object.file)
        //}

        if (!~obs.items.indexOf(object)) {
          obs.items.push(object)
        }

        if (object.node && object.node.grabInput) {
          object.node.grabInput()
        }

      })

      object.onClose(function () {
        console.log('closing', object.path)
        var index = obs.items.indexOf(object)
        if (~index) {
          obs.items.splice(index, 1)
        }
        if (object.path === obs.selected()) {
          var lastSelectedSetup = obs.items.get(index) || obs.items.get(0)
          obs.selected.set(lastSelectedSetup ? lastSelectedSetup.path : null)
        }
      })

      object.load(path)
      return object
    }
  }

  var lastSelected = null
  obs.entries(actions.scrollToSelected)
  obs.selected(function (path) {
    if (path){
      lastSelected = findItemByPath(obs.items, path)
      actions.scrollToSelected()
      process.nextTick(actions.grabInputForSelected)
    }
  })

  context.tempo = obs.tempo
  context.swing = obs.swing
  context.speed = obs.speed
  context.actions = actions
  context.project = obs

  return obs
}

function copyExternalFilesTo (fs, path, target) {
  var fromRoot = getDirectory(path)
  fs.readFile(path, 'utf8', function(err, data) {
    if (!err) {
      JSON.stringify(JSON.parse(data), function(key, value) {
        if (value && value.node === 'AudioBuffer') {
          var from = resolve(fromRoot, value.src)
          var to = resolve(target, value.src)
          fs.exists(from, function(exists) {
            if (exists) {
              fs.exists(to, function(exists) {
                if (!exists) {
                  fs.createReadStream(from).pipe(fs.createWriteStream(to))
                }
              })
            }
          })
        }
        return value
      })
    }
  })
}

function matchAny (array, match) {
  return Array.isArray(array) && match && array.some(function (value) {
    return match.exec(value)
  })
}