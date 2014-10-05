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

var soundbank = Soundbank(audioContext)
var triggerOutput = SoundbankTrigger(soundbank)
var player = Ditty()

player.pipe(triggerOutput)

var context = {
  nodes: {
    launchpad: require('loop-launchpad'),
    chunk: require('soundbank-chunk'),
    external: require('loop-drop-setup/external')
  },
  audio: audioContext,
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
  var src = project.relative(path)
  var setup = findItemByPath(setups, path)

  if (!setup){
    if (setups.getLength() === 0){
      setup = Setup(context)
      setup.load(src)
      setups.push(setup)
    } else {
      setup = lastSelectedSetup
      setup.load(src)
    }
  }

  lastSelectedSetup = setup
})

// load selected file
var lastSelectedChunk = null
selectedChunk(function(path){
  var src = project.relative(path)
  var chunk = findItemByPath(chunks, path)

  if (!chunk){
    if (lastSelectedChunk){
      chunk = lastSelectedChunk
      chunk.load(src)
    } else {
      chunk = FileObject(context)
      chunk.load(src)
      chunks.push(chunk)
    }
  }

  lastSelectedChunk = chunk
})


function findItemByPath(items, path){
  var result = null
  items.some(function(setup){
    if (setup.path === path){
      result = setup
      return true
    }
  })
  return result
}

var state = ObservStruct({

  setupBrowser: ObservStruct({
    selected: selectedSetup,
    entries: project.getDirectory('setups')
  }),

  chunkBrowser: ObservStruct({
    selected: selectedChunk,
    entries: project.getDirectory('chunks')
  }),

  setups: ObservStruct({
    selected: selectedSetup,
    items: setups
  }),

  chunks: ObservStruct({
    selected: selectedChunk,
    items: chunks
  })

})

window.state = state

setTimeout(function(){
  renderLoop(document.body, state)
}, 100)

loadDefaultProject()