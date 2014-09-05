module.exports = function(){
  chrome.storage.local.get(['editorView', 'tempo'], function(items) {

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

    console.log('state restored', items)
  })


  loadDefaultProject()
}

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

function loadProject(entry){
  var project = window.currentProject = Project(window.context, entry)

  // default directories
  project.createDirectory('setups', function(){
    project.createDirectory('samples', function(){
      project.createDirectory('chunks', loaded)
    })
  })

  function loaded(){
    chrome.storage.local.set({'projectDirectory': chrome.fileSystem.retainEntry(entry)})
    chrome.fileSystem.getDisplayPath(entry, function(path){
      console.log('Loaded project', path)
    })

    window.events.emit('changeProject', project)
  }
}