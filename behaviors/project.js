var TapeLoop = require('../lib/tape-loop')
var getSoundOffset = require('../lib/get_sound_offset')

module.exports = function(){

  window.context.audio.loadSample = loadSample
  window.context.audio.getSampleBlob = getSampleBlob

  window.events.on('newKit', newKit)
  window.events.on('loadKit', loadKit)
  window.events.on('saveKit', saveKit)
  window.events.on('renameKit', renameKit)
  window.events.on('deleteKit', deleteKit)

  window.events.on('dropFileOnSlot', dropFileOnSlot)

  // state persistance
  chrome.storage.local.get(['editorView', 'tempo', 'autoQuantize'], function(items) {

    // editor view
    window.events.emit('setEditorView', items.editorView || 'visual')
    window.events.on('setEditorView', function(view){
      chrome.storage.local.set({'editorView': view})
    })

    // tempo
    window.context.clock.setTempo(items.tempo || 120)
    window.context.clock.on('tempo', function(value){
      console.log('saving tempo')
      chrome.storage.local.set({'tempo': value})
    })

    // quantize
    var autoQuantize = items.autoQuantize || {}
    Object.keys(autoQuantize).forEach(function(key){
      window.events.emit('changeAutoQuantize', key, autoQuantize[key])
    })
    window.events.on('changeAutoQuantize', function(deckId, value){
      autoQuantize[deckId] = value
      chrome.storage.local.set({'autoQuantize': autoQuantize})
    })

    console.log('state restored', items)
  })


  loadDefaultProject()
}

function dropFileOnSlot(file, deckId, slotId){
  var fileName = Date.now() + slotId + '.wav'
  var soundbank = window.context.instances[deckId]
  var project = window.context.currentProject

  project.samples.getFile(fileName, {create: true, exclusive: false}, function(entry){
    writeFile(entry, file, function(e){
      loadSample(fileName, function(buffer){
        soundbank.update({
          id: slotId,
          sources: [{
            node: 'sample',
            mode: 'hold',
            url: entry.name,
            offset: getSoundOffset(buffer) || [0,1]
          }],
          gain: 1
        })
      })
    })
  })
}

function getSampleBlob(src, cb){
  var project = window.context.currentProject
  project.samples.getFile(src, {create: false}, function(entry){
    entry.file(function(blob){
      console.log(blob)
      cb(null, blob)
    })
  }, function(err){
    cb&&cb(err)
  })
}

function loadSample(src, cb){
  var sampleCache = window.context.audio.sampleCache
  var current = sampleCache[src]
  var audioContext = window.context.audio

  if (!current){
    current = sampleCache[src] = []
    getSampleBlob(src, function(err, blob){
      if (!err){
        readFileAsBuffer(blob, function(buffer){
          audioContext.decodeAudioData(buffer, function(audio){
            sampleCache[src] = audio
            current.forEach(function(callback){
              callback(audio)
            })
          }, handleError)
        })
      } else {
        sampleCache[src] = null
        current.forEach(function(callback){
          callback(null)
        })
      }
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

function sortKits(){
  window.context.kits = window.context.kits.sort(compareEntry)
}

function deleteKit(id){
  var entry = getKitFile(id)
  if (entry){
    backup(entry, window.context.currentProject.kitBackup, function(){
      entry.remove(function(){
        var index = window.context.kits.indexOf(entry)
        window.context.kits.splice(index, 1)
        window.events.emit('refreshKits')
      }, handleError)
    })
  }
}

function renameKit(fromId, toId){
  var newName = toId + '.json'
  var entry = getKitFile(fromId)

  if (entry && toId && toId.trim()){
    entry.moveTo(window.context.currentProject.kits, newName, function(newEntry){
      var index = window.context.kits.indexOf(entry)
      window.context.kits.splice(index, 1, newEntry)
      sortKits()
      window.events.emit('refreshKits')
    }, handleError)
  }
}

function newKit(deckId){
  var names = 'ABCDEFGH'.split('')
  var deck = window.context.instances[deckId]
  for (var i=0;i<64;i++){
    deck.update({id: String(i)})
  }
  for (var i=0;i<8;i++){
    deck.update({id: names[i]})
  }
}

function loadKit(deckId, kitName){
  getKit(kitName, function(kit){
    if (kit){
      var deck = window.context.instances[deckId]
      kit.slots.forEach(function(descriptor){
        deck.update(descriptor)
      })
      if (deckId === 'left'){
        chrome.storage.local.set({'lastLeftKit': kitName})
      }
      if (deckId === 'right'){
        chrome.storage.local.set({'lastRightKit': kitName})
      }
    }
  })
}

function saveKit(deckId, kitName){
  var names = 'ABCDEFGH'.split('')
  var kitStorage = {slots: []}
  var deck = window.context.instances[deckId]
  for (var i=0;i<64;i++){
    kitStorage.slots.push(deck.getDescriptor(i))
  }
  for (var i=0;i<8;i++){
    var id = names[i]
    kitStorage.slots.push(deck.getDescriptor(id))
  }
  writeKit(kitName, kitStorage)
}

window.chooseProject = chooseProject

function loadDefaultProject(){
  chrome.storage.local.get('projectDirectory', function(items) {
    if (items.projectDirectory) {
      chrome.fileSystem.isRestorable(items.projectDirectory, function(bIsRestorable) {
        if (!bIsRestorable){
          return chooseProject()
        }
        chrome.fileSystem.restoreEntry(items.projectDirectory, function(chosenEntry) {
          if (chosenEntry) {
            loadProject(chosenEntry)
          }
        })
      })
    } else {
      chooseProject()
    }
  })
}

function chooseProject(){
  chrome.fileSystem.chooseEntry({type: 'openDirectory'}, function(entry) {
    // use local storage to retain access to this file
    loadProject(entry)
  })
}

function handleError(err){
  console.log(err)
  throw err
}

function loadLastKits(){
  chrome.storage.local.get(['lastLeftKit', 'lastRightKit'], function(items) {
    if (items.lastLeftKit){
      window.events.emit('loadKit', 'left', items.lastLeftKit)
    }
    if (items.lastRightKit){
      window.events.emit('loadKit', 'right', items.lastRightKit)
    }
  })
}

function loadProject(entry){
  window.context.currentProject = entry
  window.context.audio.sampleCache = {}

  chrome.storage.local.set({'projectDirectory': chrome.fileSystem.retainEntry(entry)})
  chrome.fileSystem.getDisplayPath(entry, function(path){
    console.log('Loaded project', path)
  })

  entry.getDirectory('kits', {create: true, exclusive: false}, function(directory){
    directory.getDirectory('backup', {create: true, exclusive: false}, function(directory){
      window.context.currentProject.kitBackup = directory
    }, handleError)
    window.context.currentProject.kits = directory
    refreshKits(loadLastKits)
  }, handleError)

  entry.getDirectory('samples', {create: true, exclusive: false}, function(directory){
    window.context.currentProject.samples = directory
  }, handleError)

  entry.getDirectory('recordings', {create: true, exclusive: false}, function(directory){
    window.context.currentProject.recordings = directory
    setupTapeLoops(60*60) // seconds
  }, handleError)
}

var activeTapeloops = {}

function setupTapeLoops(loopLength){

  if (window.context.tapeLoop){
    window.context.recorder.unpipe(window.context.tapeLoop)
    window.context.tapeLoop.removeAllListeners()
    window.context.tapeLoop = null
    console.log('cancelling existing tapeloop')
  }

  var audioContext = window.context.audio
  var recordings = window.context.currentProject.recordings
  var instanceNames = Object.keys(window.context.instances)
  var files = []

  var offsetFile = null
  var offset = 0

  setupOffset()

  function setupOffset(){
    recordings.getFile('tapeloop.offset', {create: true, exclusive: false}, function(file){
      offsetFile = file
      readFile(file, function(data){
        offset = parseInt(data, 10) || 0
        getFiles()
      })
    }, handleError)
  }

  function getFiles(){
    forEach(instanceNames, function(name, next){
      var instance = window.context.instances[name]
      recordings.getFile(name + '-deck-tapeloop.wav', {create: true, exclusive: false}, function(file){
        files.push(file)
        next()
      }, handleError)
    }, setupWriters)
  }

  function setupWriters(){
    var writer = TapeLoop(files, {
      length: (audioContext.sampleRate * 4) * (loopLength || 10), 
      sampleRate: audioContext.sampleRate,
      offset: offset
    })

    writer.on('offset', function(offset){
      writeFile(offsetFile, JSON.stringify(offset))
    })

    console.log('tapeloop initialized (' + loopLength + ' seconds)')

    window.context.recorder.pipe(writer)
    window.context.tapeLoop = writer
  }


}

function refreshKits(cb){
  var project = window.context.currentProject
  if (project && project.kits){
    getFiles(project.kits, function(kits){
      window.context.kits = kits
      window.events.emit('refreshKits')
      cb&&cb()
    })
  }
}

function backup(entry, backup, cb){
  entry.getMetadata(function(meta){
    var modified = meta.modificationTime.getTime() / 1000
    var name = entry.name.replace(/\.json$/, '')
    var fileName = name + '.' + modified + ".json"
    entry.copyTo(backup, fileName, cb, handleError)
  }, cb)
}

function getKitFile(name){
  var fileName = name + '.json'
  for (var i=0;i<window.context.kits.length;i++){
    var entry = window.context.kits[i]
    if (entry.name === fileName){
      return entry
      break
    }
  }
}

function getKit(name, cb){
  var entry = getKitFile(name)
  if (entry){
    readFile(entry, function(content){
      cb(JSON.parse(content))
    })
  } else {
    cb(null)
  }
}

function writeKit(name, descriptor, cb){
  var fileName = name + '.json'
  var project = window.context.currentProject
  var content = JSON.stringify(descriptor, null, 2)
  for (var i=0;i<window.context.kits.length;i++){
    var entry = window.context.kits[i]
    if (entry.name === fileName){
      backup(entry, project.kitBackup, function(){
        writeFile(entry, content, cb)
      })
      return
    }
  }
  project.kits.getFile(fileName, {create: true, exclusive: false}, function(entry){
    writeFile(entry, content, function(e){
      window.context.kits.push(entry)
      sortKits()
      window.events.emit('addKit', entry)
      cb&&cb(e)
    })
  })
}

function writeFile(entry, data, cb){
  entry.createWriter(function(writer){
    writer.onwriteend = function(){
      writer.onwriteend = cb
      writer.truncate(writer.position)
    }
    writer.onerror = handleError
    if (Buffer.isBuffer(data)){
      var blob = new Blob([data]);
      writer.write(blob)
    } else {
      var blob = new Blob([data], {type: 'text/plain'});
      writer.write(blob)
    }

  }, handleError)
}

function getFiles(directory, cb){
  var reader = directory.createReader()
  var entries = []

  var readEntries = function() {
    reader.readEntries(function(results) {
      if (!results.length) {
        cb(entries)
      } else {
        results.forEach(function(entry){
          if (entry.isFile && /\.json$/.exec(entry.name)){
            entries.push(entry)
          }
        })
        readEntries()
      }
    }, handleError)
  }

  readEntries()
}

function readFile(entry, cb){
  entry.file(function(file){
    var reader = new FileReader()
    reader.onload = function(){
      cb(reader.result)
    }
    reader.onerror = handleError
    reader.readAsText(file)
  }, handleError)
}

function readFileAsBuffer(blob, cb){
  var reader = new FileReader()
  reader.onload = function(){
    cb(reader.result)
  }
  reader.onerror = handleError
  reader.readAsArrayBuffer(blob)
}

function compareEntry(a, b){
  return a.name.localeCompare(b.name)
}

function forEach(array, fn, cb){
  var i = -1
  function next(err){
    if (err) return cb&&cb(err)
    i += 1
    if (i<array.length){
      fn(array[i], next, i)
    } else {
      cb&&cb(null)
    }
  }
  next()
}