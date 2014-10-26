var Soundbank = require('soundbank')
var Ditty = require('ditty')
var SoundbankTrigger = require('soundbank-trigger')
var Recorder = require('loop-recorder')

// preloaded with all of the shared audio sources/processors/modulators/providers
var audioContext = require('loop-drop-audio-context')

// persistence
var WebFS = require('web-fs')
var Project = require('loop-drop-project')
var Setup = require('loop-drop-setup')
var FileObject = require('./lib/object')
var SampleLoader = require('./lib/sample-loader.js')
var randomColor = require('./lib/random-color.js')
var findItemByPath = require('./lib/find-item-by-path.js')

// state and rendering
var Observ = require('observ')
var ObservArray = require('observ-array')
var ObservStruct = require('observ-struct')
var watch = require('observ/watch')
var renderLoop = require('./views')

var loadDefaultProject = require('./lib/load-default-project')
//////



var project = Project()

var recorder = Recorder()
var soundbank = Soundbank(audioContext)
var triggerOutput = SoundbankTrigger(soundbank)
var player = Ditty()

audioContext.scheduler
  .pipe(player)
  .pipe(triggerOutput)
  .pipe(recorder)

soundbank.connect(audioContext.destination)

// needed for soundbank sample loading
audioContext.loadSample = SampleLoader(audioContext, project, 'samples')



var selectedSetup = Observ()
var selectedChunk = Observ()
var setups = ObservArray([])
var chunks = ObservArray([])

var context = window.context = {
  nodes: {
    controller: require('./midi-controllers.js'),
    chunk: require('./chunk-types.js'),
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

// load selected setup on change
var lastSelectedSetup = null
watch(selectedSetup, function(path){
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

// load selected file on change
var lastSelectedChunk = null
watch(selectedChunk, function(path){
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

    highlightChunkOnCurrentSetup(chunk)
    lastSelectedChunk = chunk 
  }
})


function addSetup(src){
  var setup = Setup(context)
  setup.load(src)
  setups.push(setup)
  setup.onLoad(function(){
    // don't backup a corrupted file!
    if (Object.keys(setup() || {}).length){
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

function highlightChunkOnCurrentSetup(chunk){
  if (lastSelectedSetup && chunk){
    var currentPath = null
    var id = lastSelectedSetup.selectedChunkId()
    var res = lastSelectedSetup.chunks() || []
    res.some(function(chunk){
      if (chunk.id === id && chunk.src){
        currentPath = project.resolve(chunk.src)
        return true
      }
    })
    if (chunk.path != currentPath){
      var res = lastSelectedSetup.chunks() || []
      res.some(function(chunk){
        if (project.resolve(chunk.src) === chunk.path){
          lastSelectedSetup.selectedChunkId.set(chunk.id)
          return true
        }
      })
    }
  }
}


var state = window.state = ObservStruct({

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
        file.set(JSON.stringify({node: 'setup', controllers: [], chunks: []}))
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
        file.set(JSON.stringify({
          node: 'chunk', 
          color: randomColor([255,255,255]),
          slots: [{id: 'output'}], 
          shape: [4,4],
          outputs: ['output'],
        }))
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

var forceUpdate = null
setTimeout(function(){
  forceUpdate = renderLoop(document.body, state, actions)
}, 100)


loadDefaultProject()