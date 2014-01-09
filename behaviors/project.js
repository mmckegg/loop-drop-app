module.exports = function(){
  // load data

  window.context.decks.left.changeStream.write({
    id: "0",
    offset: 0,
    sources: [
      {
        type: 'oscillator',
        shape: 1,
        note: {$: '34+offset'},
        amp: { value: 0.4, type: 'adsr', decay: 0.1, sustain: 0.5, release: 1}
      }
    ]
  })

  window.events.on('loadKit', loadKit)
  window.events.on('saveKit', saveKit)
  window.events.on('renameKit', renameKit)
  window.events.on('deleteKit', deleteKit)

  loadDefaultProject()
}

function sortKits(){
  window.context.kits = window.context.kits.sort(compareEntry)
}

function deleteKit(id){
  var entry = getKitFile(id)
  if (entry){
    entry.remove(function(){
      var index = window.context.kits.indexOf(entry)
      window.context.kits.splice(index, 1)
      window.events.emit('refreshKits')
    }, handleError)
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

function loadKit(deckId, kitName){
  getKit(kitName, function(kit){
    if (kit){
      var changeStream = window.context.decks[deckId].changeStream
      kit.slots.forEach(function(descriptor){
        changeStream.write(descriptor)
      })
    }
  })
}

function saveKit(deckId, kitName){
  var names = 'ABCDEFGH'.split('')
  var kitStorage = {slots: []}
  var slots = window.context.decks[deckId].slots
  for (var i=0;i<64;i++){
    var descriptor = slots[i] || {id: String(i)}
    kitStorage.slots.push(descriptor)
  }
  for (var i=0;i<8;i++){
    var id = names[i]
    var descriptor = slots[id] || {id: id}
    kitStorage.slots.push(descriptor)
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
  throw err
}

function loadProject(entry){
  window.context.currentProject = entry
  chrome.storage.local.set({'projectDirectory': chrome.fileSystem.retainEntry(entry)})
  chrome.fileSystem.getDisplayPath(entry, function(path){
    console.log('Loaded project', path)
  })

  entry.getDirectory('kits', {create: true, exclusive: false}, function(directory){
    window.context.currentProject.kits = directory
    refreshKits()
  }, handleError)

  entry.getDirectory('samples', {create: true, exclusive: false}, function(directory){
    window.context.currentProject.samples = directory
  }, handleError)

  entry.getDirectory('recordings', {create: true, exclusive: false}, function(directory){
    window.context.currentProject.recordings = directory
  }, handleError)
}

function refreshKits(){
  var project = window.context.currentProject
  if (project && project.kits){
    getFiles(project.kits, function(kits){
      window.context.kits = kits
      window.events.emit('refreshKits')
    })
  }
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
      writeFile(entry, content, cb)
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
    writer.onwriteend = cb
    writer.onerror = handleError
    var blob = new Blob([data], {type: 'text/plain'});
    writer.write(blob)
  }, handleError)
}

function getFiles(directory, cb){
  var reader = directory.createReader()
  var entries = []

  var readEntries = function() {
     reader.readEntries(function(results) {
      if (!results.length) {
        cb(entries.sort())
      } else {
        results.forEach(function(){})
        entries = entries.concat(results);
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

function compareEntry(a, b){
  return a.name.localeCompare(b.name)
}