var WebFS = require('web-fs')

module.exports = loadProject

function loadProject(entry){
  console.log('loading project', entry)

  var project = window.context.project
  var fs = WebFS(entry)

  project.load(entry.fullPath, fs, function(){
    // default directories
    project.createDirectory('setups', function(){
      project.createDirectory('samples', function(){
        project.createDirectory('chunks', loaded)
      })
    })
  })

  function loaded(){
    chrome.storage.local.set({'projectDirectory': chrome.fileSystem.retainEntry(entry)})
    chrome.fileSystem.getDisplayPath(entry, function(path){
      console.log('Loaded project', path)
    })
  }
}