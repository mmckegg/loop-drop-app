var Soundbank = require('soundbank')
var Ditty = require('ditty')
var SoundbankTrigger = require('soundbank-trigger')
var Recorder = require('loop-recorder')
var AudioRMS = require('audio-rms')

// preloaded with all of the shared audio sources/processors/modulators/providers
var audioContext = require('loop-drop-audio-context')

// persistence
var WebFS = require('web-fs')
var Project = require('loop-drop-project')
var Setup = require('loop-drop-setup')
var FileObject = require('./lib/object')
var SampleLoader = require('./lib/sample-loader.js')
var SampleImporter = require('./lib/sample-importer.js')
var randomColor = require('./lib/random-color.js')
var findItemByPath = require('./lib/find-item-by-path.js')

// state and rendering
var Observ = require('observ')
var ObservArray = require('observ-array')
var ObservStruct = require('observ-struct')
var watch = require('observ/watch')
var StreamObserv = require('./lib/stream-observ')
var renderLoop = require('./views')
var noDrop = require('./lib/no-drop.js')

var loadDefaultProject = require('./lib/load-default-project')
//////


var project = Project()

// main output and metering
var output = audioContext.createGain()
var outputRms = AudioRMS(audioContext)
outputRms.observ = StreamObserv(outputRms)
output.connect(outputRms.input)
output.connect(audioContext.destination)

// needed for soundbank sample loading
audioContext.loadSample = SampleLoader(audioContext, project, 'samples')
audioContext.importSample = SampleImporter(audioContext, project, 'samples')


var tempo = Observ(120)
tempo(audioContext.scheduler.setTempo.bind(audioContext.scheduler))

var selected = Observ()
var items = ObservArray([])
var lastSelected = null

selected(function(path){
  if (path){
    var src = project.relative(path)
    lastSelected = findItemByPath(items, path)

    scrollToSelected()
    process.nextTick(grabInputForSelected)
  }
})

var context = window.context = {
  nodes: {
    controller: require('./midi-controllers.js'),
    chunk: require('./chunk-types.js'),
    external: require('loop-drop-setup/external')
  },
  audio: audioContext,
  scheduler: audioContext.scheduler,
  outputRms: outputRms,
  project: project
}

function scrollToSelected(){
  setTimeout(function(){
    var el = document.querySelector('.SetupsBrowser .-selected, .ChunksBrowser .-selected')
    el && el.scrollIntoViewIfNeeded()
  }, 10)
}

function grabInputForSelected(){
  var item = lastSelected
  if (item && item.grabInput){
    item.grabInput()
  }
}

function addSetup(src){
  var ctx = Object.create(context)
  ctx.recorder = Recorder()
  ctx.soundbank = Soundbank(ctx.audio)
  ctx.triggerOutput = SoundbankTrigger(ctx.soundbank)
  ctx.player = Ditty()

  ctx.scheduler
   .pipe(ctx.player)
   .pipe(ctx.triggerOutput)
   .pipe(ctx.recorder)

  ctx.soundbank.connect(output)

  var setup = Setup(ctx)
  setup.load(src)
  items.push(setup)
  setup.onLoad(function(){
    // don't backup a corrupted file!
    if (Object.keys(setup() || {}).length){
      project.backup(setup.file)
    }
  })

  setup.onRequestEditChunk(function(chunkId){
    var chunks = setup.chunks() || []
    chunks.some(function(chunk){
      if (chunk.id === chunkId && chunk.src){
        src = chunk.src
        return true
      }
    })
    if (src){
      var path = project.resolve(src)
      actions.chunks.open(path)
    }
  })

  setup.onRequestCreateChunk(function(target){
    actions.chunks.newFile(function(err, src){

      setTimeout(function(){ // ensure rename has completed
        var id = setup.getNewChunkId(src)
        setup.chunks.push({
          node: 'external',
          src: src,
          id: id
        })
        target.controller.chunkPositions.put(id, target.at)
      }, 50)

    })
  })
  
  setup.selectedChunkId(function(id){
    var src = null
    if (selected() === setup.path){
      process.nextTick(grabInputForSelected)
    }
  })

  setup.onClose(function(){

    // disconnect
    ctx.player.emit('close') // unpipe scheduler hack
    ctx.soundbank.disconnect()

    var index = items.indexOf(setup)
    if (~index){
      items.splice(index, 1)
    }
    if (setup.path === selected()){
      var lastSelectedSetup = items.get(index) || items.get(0)
      selected.set(lastSelectedSetup ? lastSelectedSetup.path : null)
    }
  })
  return setup
}

function addChunk(src){
  var chunk = FileObject(context)
  chunk.load(src)
  items.push(chunk)
  chunk.onLoad(function(){
    if (chunk.file){
      project.backup(chunk.file)
    }
  })
  chunk.onClose(function(){
    var index = items.indexOf(chunk)
    if (~index){
      items.splice(index, 1)
    }
    if (chunk.path === selected()){
      var lastSelectedChunk = items.get(index) || items.get(0)
      selected.set(lastSelectedChunk ? lastSelectedChunk.path : null)
    }
  })
  return chunk
}

var state = window.state = ObservStruct({

  main: ObservStruct({
    tempo: tempo
  }),

  selected: selected,
  items: items,
  rawMode: Observ(false),

  setups: ObservStruct({
    items: items,
    selected: selected,
    renaming: Observ(false),
    entries: project.getDirectory('setups'),
  }),

  chunks: ObservStruct({
    items: items,
    selected: selected,
    renaming: Observ(false),
    entries: project.getDirectory('chunks'),
  })

})

var actions = {

  closeFile: function(path){
    var setup = findItemByPath(items, path)
    if (setup){
      setup.destroy()
    }
  },

  main: {
    changeProject: function(){
      loadDefaultProject.choose()
    }
  },
  setups: {

    open: function(path){
      var src = project.relative(path)
      var setup = findItemByPath(items, path)
      if (!setup){
        setup = addSetup(src)
      }
      selected.set(path)
    },

    newFile: function(){
      project.getFile('setups/New Setup.json', function(err, file){
        file.set(JSON.stringify({node: 'setup', controllers: [], chunks: []}))
        var setup = addSetup(file.src)
        selected.set(file.path)
        state.setups.renaming.set(true)
      })
    },
    deleteFile: function(path){
      var setup = findItemByPath(items, path)
      if (setup){
        setup.file.close()
        setup.file.delete()
      } else {
        var src = project.relative(path)
        project.getFile(src, function(err, file){
          file&&file.delete()
        })
      }
    }
  },
  chunks: {

    open: function(path){
      var src = project.relative(path)
      var chunk = findItemByPath(items, path)
      if (!chunk){
        chunk = addChunk(src)
      }
      selected.set(path)
    },

    newFile: function(cb){
      project.getFile('chunks/New Chunk.json', function(err, file){
        file.set(JSON.stringify({
          node: 'chunk', 
          color: randomColor([255,255,255]),
          slots: [{id: 'output'}], 
          shape: [4,4],
          outputs: ['output'],
        }))
        var chunk = addChunk(file.src)
        selected.set(file.path)
        state.chunks.renaming.set(true)

        if (typeof cb == 'function'){
          // hacky callback on rename completed
          var removeWatcher = state.chunks.renaming(function(value){
            if (!value){
              var src = project.relative(selected())
              removeWatcher()
              cb(null, src)
            }
          })
        }
      })
    },
    deleteFile: function(path){
      var chunk = findItemByPath(items, path)
      if (chunk){
        chunk.file.close()
        chunk.file.delete()
      } else {
        var src = project.relative(path)
        project.getFile(src, function(err, file){
          file&&file.delete()
        })
      }
    }
  }
}

var forceUpdate = null


// scrollToSelected when entries change
state.setups.entries(scrollToSelected)
state.chunks.entries(scrollToSelected)

// disable default drop handler
noDrop(document)

// main render loop
setTimeout(function(){
  forceUpdate = renderLoop(document.body, state, actions, context)
}, 100)


loadDefaultProject()