var Observ = require('@mmckegg/mutant/value')
var Property = require('observ-default')
var NodeArray = require('observ-node-array')
var ObservArray = require('observ-array')
var ObservStruct = require('@mmckegg/mutant/struct')
var ObservVarhash = require('observ-varhash')
var watch = require('@mmckegg/mutant/watch')
var computed = require('@mmckegg/mutant/computed')
var Event = require('geval')
var map = require('@mmckegg/mutant/map')
var resolve = require('@mmckegg/mutant/resolve')

var TapTempo = require('tap-tempo')
var Bopper = require('bopper')
var AudioRMS = require('audio-rms')

var ObservDirectory = require('lib/observ-directory')
var FileObject = require('lib/file-object')
var QueryParam = require('lib/query-param')
var findItemByPath = require('lib/find-item-by-path')
var SessionRecorder = require('lib/session-recorder')

var getDirectory = require('path').dirname
var getExt = require('path').extname
var getBaseName = require('path').basename
var join = require('path').join
var pathSep = require('path').sep
var resolvePath = require('path').resolve
var resolveAvailable = require('lib/resolve-available')
var gainToDecibels = require('decibels/from-gain')

var copyFile = require('lib/copy-file')
var moveItemToTrash = require('electron').shell.moveItemToTrash

var scrollIntoView = require('scroll-into-view')

module.exports = Project

function Project (parentContext) {
  var context = Object.create(parentContext)

  // main output and monitoring
  var masterOutput = context.audio.createGain()
  masterOutput.connect(context.audio.destination)
  masterOutput.rms = AudioRMS(context.audio)
  masterOutput.connect(masterOutput.rms.input)
  context.masterOutput = masterOutput

  // recording output and limiter
  var output = context.audio.createDynamicsCompressor()
  output.ratio.value = 20
  output.threshold.value = -1
  output.connect(masterOutput)
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
  obs.entries = ObservDirectory(context.cwd)
  obs.recordingEntries = ObservDirectory(resolvePath(context.cwd, '~recordings'), context.fs)

  obs.outputRms = Observ()
  masterOutput.rms.on('data', function (value) {
    obs.outputRms.set(value.map(gainToDecibels))
  })

  obs.availableGlobalControllers = computed([context.midiPorts], function (portNames) {
    var result = []
    var controllers = context.nodeInfo.groupLookup['global-controllers']
    if (controllers) {
      controllers.forEach(function (info) {
        var port = findMatch(portNames, info.portMatch)
        if (!info.portMatch || port) {
          result.push({
            name: info.name,
            node: info.node,
            port: port
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
  obs.items.onLoad = Event(function (broadcast) {
    broadcastItemLoaded = broadcast
  })

  var activeItems = map(obs.items, function (item) {
    return computed(item.nodeName, function (nodeName) {
      if (item.node && item.node.output && item.node.output.active) {
        return item.node.output.active
      } else {
        return false
      }
    })
  })

  var active = computed(activeItems, function (values) {
    return values.some(x => x)
  })

  // recording
  var recorder = SessionRecorder(context, active)
  obs.recording = recorder.recording
  obs.recordingPath = recorder.recordingPath
  output.connect(recorder.input)

  // clean up old preroll recordings
  recorder.cleanUpOldClips(10)

  obs.openFiles = Observ([])

  obs.resolved = ObservStruct({
    openFiles: obs.openFiles,
    renaming: obs.renaming,
    entries: obs.entries,
    recording: obs.recording,
    recordingPath: obs.recordingPath,
    recordingEntries: obs.recordingEntries,
    availableGlobalControllers: obs.availableGlobalControllers,
    selected: obs.selected
  })

  var tapTempo = TapTempo()
  tapTempo.on('tempo', function (value) {
    obs.tempo.set(Math.round(value))
  })

  var chunkScroller = null
  var actions = obs.actions = {
    prepareToClose: function (cb) {
      return recorder.stop(cb)
    },

    purge: function () {
      // avoid audio glitches by scheduling 1 second ahead
      if (global.gc) {
        var startAt = window.performance.now()
        global.gc()
        console.log(`purge took ${Math.round(window.performance.now() - startAt)} ms`)
        return true
      }
    },

    open: function (path) {
      var ext = getExt(path)
      if (!ext) {
        path = join(path, 'index.json')
      }

      var current = findItemByPath(obs.items, path)

      if (!current) {
        current = actions.addFileObject(path)
      }

      obs.selected.set(path)
    },

    openExternal: function (externalObject) {
      if (!~obs.items.indexOf(externalObject)) {
        obs.items.push(externalObject)
        externalObject.context.fileObject.onClose(function () {
          actions.closeExternal(externalObject)
        })
      }

      obs.selected.set(externalObject.path())
    },

    closeExternal: function (externalObject) {
      var index = obs.items.indexOf(externalObject)
      if (~index) {
        obs.items.splice(index, 1)
        if (externalObject.path() === obs.selected()) {
          var lastSelectedSetup = obs.items.get(index) || obs.items.get(index - 1) || obs.items.get(0)
          obs.selected.set(lastSelectedSetup ? lastSelectedSetup.path() : null)
        }
      }
    },

    select: function (pathOrItem) {
      if (typeof pathOrItem === 'string') {
        obs.selected.set(pathOrItem)
      } else if (pathOrItem.path) {
        obs.selected.set(resolve(pathOrItem.path))
      }
    },

    tapTempo: function () {
      tapTempo.tap()
    },

    newSetup: function () {
      var path = join(context.cwd, 'New Setup')
      resolveAvailable(path, context.fs, function (err, path) {
        if (err) throw err
        context.fs.mkdir(path, function (err) {
          if (err) throw err
          var setupPath = join(path, 'index.json')
          context.fs.writeFile(setupPath, JSON.stringify({node: 'setup'}), function (err) {
            if (err) throw err

            // force reload of entries, just in case watchers are glitching
            obs.entries.refresh()

            actions.addFileObject(setupPath)
            obs.selected.set(setupPath)
            obs.renaming.set(path)
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
        if (err) return cb && cb(err)
        context.fs.rename(path, newPath, function (err) {
          if (err) return cb && cb(err)

          // force reload of entries, just in case watchers are glitching
          obs.entries.refresh()
          obs.recordingEntries.refresh()

          var item = findItemByPath(obs.items, filePath)
          if (item) {
            item.load(newFilePath)
            if (isSelected) {
              obs.selected.set(resolve(item.path))
            }
          }
          cb && cb()
        })
      })
    },

    deleteEntry: function (path) {
      moveItemToTrash(path)
      obs.entries.refresh()
      obs.recordingEntries.refresh()
      obs.items.filter(function (item) {
        return resolve(item.path) && (resolve(item.path) === path || resolve(item.path).startsWith(path + pathSep))
      }).forEach(function (item) {
        if (item.close) {
          item.close()
        } else {
          actions.closeExternal(item)
        }
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
          fileObject.file.rename(newChunkId + '.json')
          QueryParam(chunk, 'src').set(newSrc)
        }
      }
    },

    scrollToSelected: function () {
      setTimeout(function () {
        var el = document.querySelector('.SetupsBrowser .-selected, .ChunksBrowser .-selected')
        el && el.scrollIntoViewIfNeeded()
      }, 10)
    },

    scrollToRecording: function () {
      setTimeout(function () {
        var el = document.querySelector('.BrowserFile.-recording')
        el && el.scrollIntoViewIfNeeded()
      }, 100)
    },

    scrollToSelectedChunk: function () {
      clearTimeout(chunkScroller)
      chunkScroller = setTimeout(function () {
        var el = document.querySelector('.-active .ExternalNode.-selected')
        if (el) {
          scrollIntoView(el, { time: 200 })
        }
      }, 200)
    },

    grabInputForSelected: function () {
      var item = lastSelected
      if (item && item.node) {
        if (item.node.grabInput) {
          item.node.grabInput()
        } else if (item.node.context.setup && item.node.context.setup.grabInput) {
          item.node.context.setup.grabInput()
        }
      }
    },

    addFileObject: function (path) {
      var object = FileObject(context)

      // HACK: avoid audio glitches by scheduling 1 second ahead
      scheduler.schedule(1)

      object.onLoad(function () {
        broadcastItemLoaded(object)

        if (!~obs.items.indexOf(object)) {
          obs.items.push(object)
        }

        if (object.node && object.node.grabInput) {
          object.node.grabInput()
        }

        refreshOpenFiles()
      })

      object.onClosing(function () {
        scheduler.schedule(1)
        setImmediate(actions.purge)
      })

      object.onClose(function () {
        console.log('closing', resolve(object.path))
        var index = obs.items.indexOf(object)
        if (~index) {
          obs.items.splice(index, 1)
        }
        if (resolve(object.path) === obs.selected()) {
          var lastSelectedSetup = obs.items.get(index) || obs.items.get(index - 1) || obs.items.get(0)
          obs.selected.set(lastSelectedSetup ? resolve(lastSelectedSetup.path) : null)
        }
        refreshOpenFiles()
      })

      object.load(path)
      return object
    }
  }

  var lastSelected = null
  obs.entries(actions.scrollToSelected)
  obs.selected(function (path) {
    if (path) {
      lastSelected = findItemByPath(obs.items, path)
      actions.scrollToSelected()
      process.nextTick(actions.grabInputForSelected)
    }
  })

  obs.recordingPath(actions.scrollToRecording)

  context.tempo = obs.tempo
  context.swing = obs.swing
  context.speed = obs.speed
  context.actions = actions
  context.project = obs

  return obs

  // scoped

  function refreshOpenFiles () {
    obs.openFiles.set(obs.items.map(function (item) {
      return resolve(item.path)
    }))
  }
}

function copyExternalFilesTo (fs, path, target) {
  var fromRoot = getDirectory(path)
  fs.readFile(path, 'utf8', function (err, data) {
    if (!err) {
      JSON.stringify(JSON.parse(data), function (key, value) {
        if (value && value.node === 'AudioBuffer') {
          var from = resolvePath(fromRoot, value.src)
          var to = resolvePath(target, value.src)
          fs.exists(from, function (exists) {
            if (exists) {
              fs.exists(to, function (exists) {
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

function findMatch (array, match) {
  return Array.isArray(array) && match && array.filter(function (value) {
    return match.exec(value)
  })[0]
}
