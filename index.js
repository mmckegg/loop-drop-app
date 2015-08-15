// persistence
var fs = require('fs')
var Setup = require('loop-drop-setup')
var FileObject = require('loop-drop-project/file-object')
var randomColor = require('lib/random-color')
var findItemByPath = require('lib/find-item-by-path')
var SessionRecorder = require('lib/session-recorder')

// state 
var ipc = require('ipc')
var Observ = require('observ')
var ObservArray = require('observ-array')
var ObservStruct = require('observ-struct')
var ObservVarhash = require('observ-varhash')
var QueryParam = require('loop-drop-setup/query-param')
var watch = require('observ/watch')
var Event = require('geval')

// rendering
var noDrop = require('lib/no-drop')
var renderLoop = require('./views')
var frame = require('web-frame')

// path
var getDirectory = require('path').dirname
var getExt = require('path').extname
var getBaseName = require('path').basename
var join = require('path').join

var extend = require('xtend')

//////
var insertCss = require('insert-css')
insertCss(require('./styles'))


var rootContext = window.rootContext = require('lib/context')
var project = rootContext.project
var recorder = SessionRecorder(rootContext)
var state = window.state = ObservStruct({
  zoom: Observ(1.1),
  tempo: rootContext.tempo,
  recording: recorder.recording,
  selected: Observ(),
  items: ObservArray([]),
  rawMode: Observ(false),
  renaming: Observ(false),
  entries: project.getDirectory('.'),
  subEntries: ObservVarhash({})
})

var broadcastItemLoaded = null
state.items.onLoad = Event(function(broadcast) { 
  broadcastItemLoaded = broadcast 
})

watch(state.zoom, function(value) {
  frame.setZoomFactor(value || 1)
})

var actions = rootContext.actions = {

  open: function(path){
    var ext = getExt(path)
    if (!ext){
      path = join(path, 'index.json')
    }

    var src = project.relative(path)
    var current = findItemByPath(state.items, path)

    if (!current){
      current = actions.addFileObject(src)
    }

    state.selected.set(path)
  },

  closeFile: function(path){
    var object = findItemByPath(state.items, path)
    if (object){
      object.close()
    }
  },

  toggleDirectory: function(path){
    var directory = state.subEntries.get(path)
    if (directory){
      state.subEntries.put(path, null)
      directory.close()
    } else {
      var src = project.relative(path)
      state.subEntries.put(path, project.getDirectory(src))
    }
  },

  newSetup: function(){
    project.resolveAvailable('New Setup', function(err, src){
      project.createDirectory(src, function(err, dir){
        project.getFile(join(src, 'index.json'), function(err, file){
          file.set(JSON.stringify({node: 'setup', controllers: [], chunks: []}))
          var setup = actions.addFileObject(file.src)
          state.selected.set(file.path)
          state.renaming.set(true)
        })
      })
    })
  },

  rename: function(path, newName, cb){
    var src = project.relative(path)
    var ext = getExt(path)

    var newPath = join(getDirectory(path), newName)
    var newSrc = project.relative(newPath)

    var newFileSrc = ext ? newSrc : join(newSrc, 'index.json')
    var filePath = ext ? path : join(path, 'index.json')

    var isSelected = path === state.selected() || filePath === state.selected()

    project.moveEntry(src, newSrc, function(err){
      if (err) return cb&&cb(err)
      var item = findItemByPath(state.items, filePath)
      if (item){
        item.load(newFileSrc)
        if (isSelected){
          state.selected.set(item.path)
        }
      }
      cb&&cb()
    })
  },

  deleteEntry: function(path, cb){
    var src = project.relative(path)
    project.deleteEntry(src, cb)
  },

  newChunk: function(path, descriptor, cb){
    // ensure expanded

    project.resolveAvailable(project.relative(path), function(err, src){
      if (typeof descriptor === 'function'){
        cb = descriptor
        descriptor = null
      }

      descriptor = descriptor || {}

      descriptor = extend({
        node: 'chunk', 
        color: randomColor([255,255,255]),
        slots: [{id: 'output', node: 'slot'}], 
        shape: [2,4],
        outputs: ['output'],
      }, descriptor)

      project.getFile(src, function(err, file){
        if (err) return cb&&cb(err)
        file.set(JSON.stringify(descriptor))
        cb(null, src)
      })
    })
  },

  importChunk: function(path, cwd, cb) {
    var src = project.relative(path)
    var baseName = getBaseName(path)
    var targetSrc = project.relative(join(cwd, baseName))

    project.resolveAvailable(targetSrc, function(err, toSrc) {
      copyExternalFilesTo(path, cwd)
      project.copyEntry(src, toSrc, function(err){
        if (cb) {
          if (err) return cb(err)
          cb(null, project.resolve(toSrc))
        }
      })
    })
  },

  updateChunkReferences: function(chunkId, newChunkId, chunk){
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
    setTimeout(function(){
      var el = document.querySelector('.ExternalNode.-selected')
      el && el.scrollIntoViewIfNeeded()
    }, 10)
  },

  grabInputForSelected: function(){
    var item = lastSelected
    if (item && item.node && item.node.grabInput){
      item.node.grabInput()
    }
  },

  addFileObject: function(src){

    var object = FileObject(rootContext)

    window.rootContext.scheduler.schedule(1)

    object.onLoad(function(){

      broadcastItemLoaded(object)

      // don't backup a corrupted file!
      if (Object.keys(object() || {}).length){
        project.backup(object.file)
      }

      if (!~state.items.indexOf(object)){
        state.items.push(object)
      }

      if (object.node && object.node.grabInput){
        object.node.grabInput()
      }

      if (object.node && object.node.selectedChunkId) {
        object.node.selectedChunkId(actions.scrollToSelectedChunk)
      }

    })

    object.onClose(function(){
      console.log('closing', object.path)
      var index = state.items.indexOf(object)
      if (~index){
        state.items.splice(index, 1)
      }
      if (object.path === state.selected()){
        var lastSelectedSetup = state.items.get(index) || state.items.get(0)
        state.selected.set(lastSelectedSetup ? lastSelectedSetup.path : null)
      }
    })

    object.load(src)
    return object
  },

  loadProject: function(path){
    console.log('loading project', path)
    project.load(path, fs, loaded)
    function loaded(){
      console.log('Loaded project', path)
    }
  }
}


// state binding
var lastSelected = null
state.entries(actions.scrollToSelected)
state.selected(function(path){
  if (path){
    var src = project.relative(path)
    lastSelected = findItemByPath(state.items, path)

    actions.scrollToSelected()
    process.nextTick(actions.grabInputForSelected)
  }
})

function copyExternalFilesTo(path, target) {
  var src = project.relative(path)
  var fromRoot = getDirectory(path)

  project.getFile(src, function(err, file) {
    if (!err) {
      JSON.stringify(JSON.parse(file()), function(key, value) {
        if (value && value.node === 'AudioBuffer') {
          var from = project.resolve([fromRoot, value.src])
          var to = project.resolve([target, value.src])
          project.resolveAvailable(to, function(err, checkTo) {
            if (to === checkTo) {
              project.copyEntry(from, to)
              console.log(from, to)
            }
          })
        }
        return value
      })
    }
  })
}


// disable default drop handler

// main render loop
var forceUpdate = null
document.addEventListener("DOMContentLoaded", function(event) {
  noDrop(document)
  forceUpdate = renderLoop(document.body, state, actions, rootContext)
})

var applyTempo = require('lib/keyboard-tempo')
applyTempo(rootContext.tempo, rootContext.speed)

ipc.send('loaded')
ipc.on('load-project', actions.loadProject)

require('./extend')(rootContext, state)
require('lib/context-menu')