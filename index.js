process.nextTick = null
process.nextTick = require('next-tick')

// persistence
var WebFS = require('web-fs')
var Setup = require('loop-drop-setup')
var FileObject = require('loop-drop-project/file-object')
var randomColor = require('lib/random-color')
var findItemByPath = require('lib/find-item-by-path')

var QueryParam = require('loop-drop-setup/query-param')

// state and rendering
var hg = require('mercury')
var noDrop = require('lib/no-drop')
var renderLoop = require('./views')

// path
var getDirectory = require('path').dirname
var getExt = require('path').extname
var getBaseName = require('path').basename

var extend = require('xtend')

//////


var rootContext = window.rootContext = require('lib/context')
var project = rootContext.project
var state = window.state = hg.struct({
  tempo: rootContext.tempo,
  selected: hg.value(),
  items: hg.array([]),
  rawMode: hg.value(false),
  renaming: hg.value(false),
  entries: project.getDirectory('.'),
  subEntries: hg.varhash({})
})

// record output
var stopRecording = null
var recorders = []

function noop(){}

function recordOutput(path){
  console.log('recording output to', path)
  var fs = project._state.fs
  var stream = fs.createWriteStream(path)
  var WaveRecorder = require('wave-recorder')
  var recorder = WaveRecorder(rootContext.audio, {silenceDuration: 5, bitDepth: 32})
  recorder.pipe(stream)

  recorder.on('header', function(){
    fs.write(path, recorder._header, 0, recorder._header.length, 0, noop)
  })
  recorders.push(recorder)
  rootContext.output.connect(recorder.input)
  return function stop(){
    recorder.destroy()
    recorders.splice(recorders.indexOf(recorder, 1))
    clearTimeout(headerTimer)
  }
}


var actions = rootContext.actions = {

  open: function(path){
    var ext = getExt(path)
    if (!ext){
      path = path + '/' + 'index.json'
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
    project.resolveAvailable('./New Setup', function(err, src){
      project.createDirectory(src, function(err, dir){
        project.getFile(src + '/index.json', function(err, file){
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

    var newPath = getDirectory(path) + '/' + newName
    var newSrc = project.relative(newPath)

    var newFileSrc = ext ? newSrc : newSrc + '/index.json' 
    var filePath = ext ? path : path + '/index.json'

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

  updateChunkReferences: function(chunkId, newChunkId, chunk){
    var setup = chunk.context.setup
    var fileObject = chunk.context.fileObject
    var descriptor = chunk()

    setup.updateChunkReferences(chunkId, newChunkId)

    if (chunk._type === 'ExternalNode' && descriptor.src) {

      // only rename if old file matches ID
      var oldSrc = './' + chunkId + '.json'
      var newSrc = './' + newChunkId + '.json'
      if (oldSrc === descriptor.src) {
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

  grabInputForSelected: function(){
    var item = lastSelected
    if (item && item.node && item.node.grabInput){
      item.node.grabInput()
    }
  },

  addFileObject: function(src){

    var object = FileObject(rootContext)

    object.onLoad(function(){

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

  chooseProject: function(){
    chrome.fileSystem.chooseEntry({type: 'openDirectory'}, actions.loadProject)
  },

  loadDefaultProject: function(){
    chrome.storage.local.get('projectDirectory', function(items) {
      if (items.projectDirectory) {
        chrome.fileSystem.isRestorable(items.projectDirectory, function(bIsRestorable) {
          if (!bIsRestorable){
            return actions.chooseProject()
          }
          chrome.fileSystem.restoreEntry(items.projectDirectory, function(chosenEntry) {
            if (chosenEntry) {
              actions.loadProject(chosenEntry)
            }
          })
        })
      } else {
        actions.chooseProject()
      }
    })
  },

  loadProject: function(entry){
    console.log('loading project', entry)

    stopRecording && stopRecording()
    stopRecording = null

    var fs = WebFS(entry)

    project.load(entry.fullPath, fs, loaded)

    function loaded(){
      chrome.storage.local.set({'projectDirectory': chrome.fileSystem.retainEntry(entry)})
      //stopRecording = recordOutput(project.resolve('./session.wav'))
      chrome.fileSystem.getDisplayPath(entry, function(path){
        console.log('Loaded project', path)
      })
    }
  }
}


// state binding
var lastSelected = null
state.entries(actions.scrollToSelected)
state.selected(function(path){
  if (path){

    var dir = getDirectory(path)
    if (!state.subEntries.get(dir)){
      actions.toggleDirectory(dir)
    }

    var src = project.relative(path)
    lastSelected = findItemByPath(state.items, path)

    actions.scrollToSelected()
    process.nextTick(actions.grabInputForSelected)
  }
})


// disable default drop handler
noDrop(document)

// main render loop
var forceUpdate = null
setTimeout(function(){
  forceUpdate = renderLoop(document.body, state, actions, rootContext)
}, 100)

actions.loadDefaultProject()