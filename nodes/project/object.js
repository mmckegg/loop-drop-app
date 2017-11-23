var Observ = require('mutant/value')
var Property = require('lib/property')
var Slots = require('lib/slots')
var MutantArray = require('mutant/array')
var ObservStruct = require('mutant/struct')
var Dict = require('mutant/dict')
var watch = require('mutant/watch')
var computed = require('mutant/computed')
var Event = require('geval')
var map = require('mutant/map')
var resolve = require('mutant/resolve')

var TapTempo = require('tap-tempo')
var Bopper = require('bopper')
var ObservRms = require('lib/observ-rms')

var ObservDirectory = require('lib/observ-directory')
var FileObject = require('lib/file-object')
var QueryParam = require('lib/query-param')
var findItemByPath = require('lib/find-item-by-path')
var SessionRecorder = require('lib/session-recorder')
var Cleaner = require('lib/cleaner')

var getDirectory = require('path').dirname
var getExt = require('path').extname
var join = require('path').join
var pathSep = require('path').sep
var resolvePath = require('path').resolve
var resolveFileAvailable = require('lib/resolve-file-available')
var onceIdle = require('mutant/once-idle')
var ncp = require('ncp')

var moveItemToTrash = require('electron').shell.moveItemToTrash

var scrollIntoView = require('scroll-into-view')
var MultiChannelOutput = require('lib/multi-channel-output')

module.exports = Project

function Project (parentContext) {
  var context = Object.create(parentContext)

  // main output and monitoring
  var masterOutput = context.audio.createGain()
  masterOutput.channelCount = 2
  context.masterOutput = masterOutput

  // setup multichannel output
  var multiChannelOutput = MultiChannelOutput(context.audio.destination)
  multiChannelOutput.set({
    '5,6': masterOutput
  })

  context.cleaner = Cleaner(context.audio)

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

  context.paramLookup = Dict({})

  var obs = ObservStruct({
    zoom: parentContext.zoom,
    tempo: Property(120),
    swing: Property(0),
    rawMode: Property(false),
    globalControllers: Slots(context)
  })

  obs.context = context
  obs.speed = Observ(1)
  obs.selected = Observ()
  obs.renaming = Observ(false)
  obs.duplicating = Observ(false)

  obs.entries = ObservDirectory(resolve(context.cwd))

  obs.recordingEntries = ObservDirectory(resolvePath(resolve(context.cwd), '~recordings'))

  obs.outputRms = ObservRms(masterOutput)

  obs.availableGlobalControllers = computed([context.midiPorts, context.midiPorts.output, context.midiPorts.input], function (both, input, output) {
    var result = {}
    var controllers = context.nodeInfo.groupLookup['global-controllers']
    if (controllers) {
      controllers.forEach(function (info) {
        if (info.portMatch) {
          var portNames = info.inputOnly ? input : info.outputOnly
            ? output
            : both

          var ports = findMatches(portNames, info.portMatch)
          if (ports && ports.length) {
            result[info.node] = ports.map(port => {
              return {
                name: info.name,
                node: info.node,
                port: port
              }
            })
          }
        } else {
          result[info.node] = {
            name: info.name,
            node: info.node
          }
        }
      })
    }
    return result
  }, {nextTick: true})

  // apply tempo
  watch(obs.tempo, scheduler.setTempo.bind(scheduler))
  watch(obs.speed, scheduler.setSpeed.bind(scheduler))

  var broadcastItemLoaded = null
  obs.items = MutantArray([])
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
  obs.recordPosition = recorder.recordPosition
  obs.recordingPath = recorder.recordingPath
  output.connect(recorder.input)

  // clean up old preroll recordings
  recorder.cleanUpOldClips(10)

  var tapTempo = TapTempo()
  tapTempo.on('tempo', function (value) {
    obs.tempo.set(Math.round(value))
  })

  var chunkScroller = null
  var lastPurgeTime = 30

  obs.isReadyToClose = computed([recorder.recording], (recording) => {
    return !recording
  })

  var actions = obs.actions = {
    prepareToClose: function (cb) {
      return recorder.stop(cb)
    },

    purge: function () {
      if (global.gc) {
        // schedule twice the length last gc() took of audio
        context.scheduler.schedule(lastPurgeTime / 1000 * 2)

        var startAt = window.performance.now()
        global.gc()
        lastPurgeTime = window.performance.now() - startAt
        console.log(`purge took ${Math.round(lastPurgeTime)} ms`)
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
        obs.items.delete(externalObject)
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

    duplicateCurrent: function () {
      if (obs.selected()) {
        obs.duplicating.set(true)
        var path = getDirectory(obs.selected())
        var setupPath = join(path, 'index.json')
        var item = findItemByPath(obs.items, setupPath)

        if (item) {
          resolveFileAvailable(path, context.fs, function (err, newPath) {
            if (err) throw err
            ncp(path, newPath, (err) => {
              obs.duplicating.set(false)

              if (err) throw err
              obs.entries.refresh()
              obs.recordingEntries.refresh()

              var newSetupPath = join(newPath, 'index.json')
              console.log(`Duplicated "${path}"`)
              item.load(newSetupPath)
              obs.selected.set(resolve(item.path))
              obs.renaming.set(newPath)
            })
          })
        }
      }
    },

    newSetup: function () {
      var path = join(resolve(context.cwd), 'New Setup')
      resolveFileAvailable(path, context.fs, function (err, path) {
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

      resolveFileAvailable(newPath, context.fs, function (err, newPath) {
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
      obs.items.forEach(function (item) {
        if (resolve(item.path) && (resolve(item.path) === path || resolve(item.path).startsWith(path + pathSep))) {
          if (item.close) {
            item.close()
          } else {
            actions.closeExternal(item)
          }
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
      scheduler.schedule(0.5)
      var timer = setInterval(() => scheduler.schedule(0.5), 460)

      object.onLoad(function () {
        broadcastItemLoaded(object)
        onceIdle(() => {
          clearInterval(timer)
          if (object.node && object.node.grabInput) {
            object.node.grabInput()
          }
        })

        if (!~obs.items.indexOf(object)) {
          obs.items.push(object)
        }
      })

      object.onClosing(function () {
        scheduler.schedule(0.2)
      })

      object.onClose(function () {
        console.log('closing', resolve(object.path))
        var nodeName = object.nodeName && object.nodeName()
        var index = obs.items.indexOf(object)
        if (~index) {
          obs.items.delete(object)
        }
        if (resolve(object.path) === obs.selected()) {
          var lastSelectedSetup = obs.items.get(index) || obs.items.get(index - 1) || obs.items.get(0)
          obs.selected.set(lastSelectedSetup ? resolve(lastSelectedSetup.path) : null)
        }
        if (nodeName === 'setup') {
          window.requestIdleCallback(() => {
            actions.purge()
          })
        }
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
      onceIdle(actions.grabInputForSelected)
    }
  })

  obs.recordingPath(actions.scrollToRecording)

  context.tempo = obs.tempo
  context.swing = obs.swing
  context.speed = obs.speed
  context.actions = actions
  context.project = obs

  return obs
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

function findMatches (array, match) {
  return Array.isArray(array) && match && array.filter(function (value) {
    return match.exec(value)
  })
}
