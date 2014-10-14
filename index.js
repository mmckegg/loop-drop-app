/*

Project browser needs seperate tabs/zones for the 3 main categories
  - setups
  - chunks
  - samples

Update loop-drop-project to support getEntry(src) instead of using the generic project.entries.
The returned entry should update whenever the tree below the entry changes. 
It should also update on project change.

Figure out how to trigger setup load. Clicking on it should allow edit, but should it load?
Maybe need a seperate load button that shows on hover? Need a place to show currently loaded setup.
Perhaps an editor tab?

Raw could be a checkbox that appears on every visual editor.

Need to figure out how nested visual editors will work.


----

Split pane interface

----------------------------------------------------------------------|
| setups        |   LOADED 1  x   |   LOADED 2  x  |                  |
|               |--vvvvvvvvvvvvvv-------------------------------------|
|               |  Tempo  | 120 bpm |          Output |  -5 dB  |
|               |  
|               |
|               |
|               |
|               |  + Add Launchpad 
|---------------------------------------------------------------------|
| chunks | samp |   editing 1  x  |   editing 2  x  |  ediing 3   x   |
|               |---vvvvvvvvvvvv--------------------------------------|
|               |  1  | 2  | 3  | 4  | 5 |  6 |  7 |  8 |
|               |-vvvv-------------------------------------------------
|               |   Oscilliator        |  Filter
|               |   -----------------  |  --------------
|               |                      |
|               |                      |
|               |                      > 
|               |                      |
|               |                      |
|               |                      |
----------------------------------------------------------------------|

*/

var mercury = require('mercury')

var EventEmitter = require('events').EventEmitter
var Soundbank = require('soundbank')
var Ditty = require('ditty')
var SoundbankTrigger = require('soundbank-trigger')
var Recorder = require('loop-recorder')

var Project = require('loop-drop-project')
var Setup = require('loop-drop-setup')
var FileObject = require('./lib/object')

var extendBrowser = require('./views/browser')
var extendTabbedEditor = require('./views/tabbed-editor')

var Observ = require('observ')
var ObservArray = require('observ-array')
var ObservStruct = require('observ-struct')
var EditorState = require('./lib/editor-state.js')
var renderLoop = require('./views')

var audioContext = require('loop-drop-audio-context')

var loadDefaultProject = require('./lib/load-default-project')
var WebFS = require('web-fs')
//////

var project = Project()
var selectedSetup = Observ()
var selectedChunk = Observ()

var recorder = Recorder()
var soundbank = Soundbank(audioContext)
var triggerOutput = SoundbankTrigger(soundbank)
var player = Ditty()
var clock = audioContext.scheduler

clock
  .pipe(player)
  .pipe(triggerOutput)
  .pipe(recorder)

soundbank.connect(audioContext.destination)

var join = require('path').join
audioContext.loadSample = function(url, cb){
  var audioContext = this
  var sampleCache = audioContext.sampleCache
  
  var src = join('samples', url)
  var path = project.resolve(src)

  var current = sampleCache[url]

  if (!current){
    current = sampleCache[url] = []
    requestSample(src, function(err, buffer){
      sampleCache[url] = buffer
      current.forEach(function(callback){
        callback(buffer)
      })
    })
  }

  if (cb){
    if (Array.isArray(current)){
      current.push(cb)
    } else {
      cb(current)
    }
  }
}

function requestSample(src, cb){
  project.checkExists(src, function(err, exists){
    if (exists){
      project.getFile(src, 'arraybuffer', function(err, file){
        if (err) return cb&&cb(err)
        audioContext.decodeAudioData(file(), function(buffer) {
          console.log('loaded sample', src)
          cb&&cb(null, buffer)
        }, function(err){
          cb&&cb(err)
        })
      })
    }
  })
}



var context = {
  nodes: {
    launchpad: require('loop-launchpad'),
    chunk: require('soundbank-chunk'),
    rangeChunk: require('soundbank-chunk/range'),
    external: require('loop-drop-setup/external')
  },
  audio: audioContext,
  recorder: recorder,
  soundbank: soundbank,
  scheduler: audioContext.scheduler,
  triggerOutput: triggerOutput,
  player: player,
  project: project
}

var setups = ObservArray([])
var chunks = ObservArray([])

window.context = context

// load selected setup
var lastSelectedSetup = null
selectedSetup(function(path){
  if (path){
    var src = project.relative(path)
    var setup = findItemByPath(setups, path)

    if (!setup){
      if (setups.getLength() === 0){
        setup = addSetup(src)
      } else {
        setup = lastSelectedSetup
        setup.load(src)
      }
    }

    lastSelectedSetup = setup
  }
})

function addSetup(src){
  var setup = Setup(context)
  setup.load(src)
  setups.push(setup)
  setup.onLoad(function(){
    if (setup.file){
      project.backup(setup.file)
    }
  })
  
  setup.selectedChunkId(function(id){
    var src = null
    if (selectedSetup() === setup.path){
      var chunks = setup.chunks() || []
      chunks.some(function(chunk){
        if (chunk.id === id && chunk.src){
          src = chunk.src
          return true
        }
      })
      if (src){
        var path = project.resolve(src)
        state.chunks.selected.set(path)
      }
    }
  })

  setup.onClose(function(){
    var index = setups.indexOf(setup)
    if (~index){
      setups.splice(index, 1)
    }
    if (setup.path === selectedSetup()){
      lastSelectedSetup = setups.get(index) || setups.get(0)
      selectedSetup.set(lastSelectedSetup ? lastSelectedSetup.path : null)
    }
  })
  return setup
}

function addChunk(src){
  var chunk = FileObject(context)
  chunk.load(src)
  chunks.push(chunk)
  chunk.onLoad(function(){
    if (chunk.file){
      project.backup(chunk.file)
    }
  })
  chunk.onClose(function(){
    var index = chunks.indexOf(chunk)
    if (~index){
      chunks.splice(index, 1)
    }
    if (chunk.path === selectedChunk()){
      lastSelectedChunk = chunks.get(index) || chunks.get(0)
      selectedChunk.set(lastSelectedChunk ? lastSelectedChunk.path : null)
    }
  })
  return chunk
}

// load selected file
var lastSelectedChunk = null
selectedChunk(function(path){
  if (path){
    var src = project.relative(path)
    var chunk = findItemByPath(chunks, path)

    if (!chunk){
      if (lastSelectedChunk){
        chunk = lastSelectedChunk
        chunk.load(src, function(){
          project.backup(chunk.file)
        })

      } else {
        chunk = addChunk(src)
      }
    }

    lastSelectedChunk = chunk

    // chunk selection link
    if (lastSelectedSetup){
      var currentPath = null
      var id = lastSelectedSetup.selectedChunkId()
      var chunks = lastSelectedSetup.chunks() || []
      chunks.some(function(chunk){
        if (chunk.id === id && chunk.src){
          currentPath = project.resolve(chunk.src)
          return true
        }
      })
      if (path != currentPath){
        var chunks = lastSelectedSetup.chunks() || []
        chunks.some(function(chunk){
          if (project.resolve(chunk.src) === path){
            lastSelectedSetup.selectedChunkId.set(chunk.id)
            return true
          }
        })
      }
    }
  }
})

function findItemByPath(items, path){
  var result = null
  if (items){
    items.some(function(setup){
      if (setup.path === path){
        result = setup
        return true
      }
    })
  }
  return result
}

var dragPath = Observ()

var state = ObservStruct({

  setups: ObservStruct({
    selected: selectedSetup,
    renaming: Observ(false),
    entries: project.getDirectory('setups'),
    items: setups,
    rawMode: Observ(false)
  }),

  chunks: ObservStruct({
    selected: selectedChunk,
    renaming: Observ(false),
    entries: project.getDirectory('chunks'),
    items: chunks,
    rawMode: Observ(false)
  })

})

var actions = {
  setups: {
    openNewWindow: function(path){
      var src = project.relative(path)
      var setup = findItemByPath(setups, path)
      if (!setup){
        setup = addSetup(src)
      }
      state.setups.selected.set(path)
    },
    newFile: function(){
      project.getFile('setups/New Setup.json', function(err, file){
        file.set('{"node":"setup"}')
        var setup = addSetup(file.src)
        selectedSetup.set(file.path)
        state.setups.renaming.set(true)
      })
    },
    deleteFile: function(path){
      var setup = findItemByPath(setups, path)
      if (setup){
        setup.file.close()
        setup.file.delete()
      } else {
        var src = project.relative(path)
        project.getFile(src, function(err, file){
          file&&file.delete()
        })
      }
    },
    closeFile: function(path){
      var setup = findItemByPath(setups, path)
      if (setup){
        setup.destroy()
      }
    }
  },
  chunks: {
    openNewWindow: function(path){
      var src = project.relative(path)
      var chunk = findItemByPath(chunks, path)
      if (!chunk){
        chunk = addChunk(src)
      }
      state.chunks.selected.set(path)
    },
    newFile: function(){
      project.getFile('chunks/New Chunk.json', function(err, file){
        file.set('{"node":"chunk"}')
        var chunk = addChunk(file.src)
        state.chunks.selected.set(file.path)
        state.chunks.renaming.set(true)
      })
    },
    deleteFile: function(path){
      var chunk = findItemByPath(chunks, path)
      if (chunk){
        chunk.file.close()
        chunk.file.delete()
      } else {
        var src = project.relative(path)
        project.getFile(src, function(err, file){
          file&&file.delete()
        })
      }
    },
    closeFile: function(path){
      var chunk = findItemByPath(chunks, path)
      if (chunk){
        chunk.destroy()
      }
    }
  }
}

window.state = state

var forceUpdate = null

setTimeout(function(){
  forceUpdate = renderLoop(document.body, state, actions)
}, 100)

function getFileItem(element){
  while (element && element.classList.contains('BrowserFile')){
    element = element.parentNode
  }
  return element
}

loadDefaultProject()