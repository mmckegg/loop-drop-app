var join = require('path').join
var WebFS = require('web-fs')
var nextTick = require('next-tick')
var Observ = require('observ')
var map = require('map-async')

module.exports = Project

function Project(context, directoryEntry){
  var project = Object.create(context)
  var fs = WebFS(directoryEntry)

  project.entry = directoryEntry
  project.entries = Observ()

  function refreshEntries(){
    getEntries('/', function(err, entries){
      project.entries.set(entries)
    })
  }

  function getEntries(root, cb){
    project.list(root, function(paths){
      map(files, function(value, key, next){
        fs.stat(value, function(err, stats){
          if (err) return next(err)
          if (stats.isDirectory()){
            var result = {
              type: 'directory',
              fileName: stats.name,
              fullPath: stats.fullPath,
              entries: []
            }
            getEntries(stats.fullPath, function(err, entries){
              if (err) return next(err)
              result.entries = entries
              next(null, result)
            })
          } else {
            next(null, {
              type: 'file',
              fileName: stats.name,
              fullPath: stats.fullPath,
            })
          }
        })
      }, cb)
    })
  }

  function statMap(fs, files, cb){
    map(files, function(value, key, next){
      fs.stats(value, cb)
    }, cb)
  }

  project.list = function(root, cb){
    fs.readdir(root, function(err, files){
      if(err)return cb&&cb(err)
      cb(null, files.map(function(file){
        return join(root, file)
      }))
    })
  }

  project.createDirectory = function(path, cb){
    fs.mkdir(path, cb)
  }

  var fileCache = {}
  project.getFile = function(src, cb){
    if (fileCache[src]){
      nextTick(function(){
        cb(fileCache[src])
      })
    } else {
      fs.readFile(src, 'utf8', function(err, data){
        var file = fileCache[src] = Observ(data)
        file.src = src
        file.delete = deleteHandler
        file(function(data){
          if (file.src){
            fs.writeFile(src, data)
          }
        })
      })
    }
  }

  var audioBufferCache = {}
  project.getAudioBuffer = function(src, cb){
    if (typeof src === 'string' && cb === 'function'){
      if (audioBuffer[src]){
        if (Array.isArray(audioBuffer[src])){
          audioBuffer[src].push(cb)
        } else {
          nextTick(function(){
            cb(audioBuffer[src])
          })
        }
      } else {
        audioBufferCache[src] = [cb]
        fs.readFile(src, 'arraybuffer', function(err, buffer){
          context.audio.decodeAudioData(buffer, function(audioBuffer){
            var callbacks = audioBufferCache[src]
            audioBufferCache[src] = audioBuffer
            callbacks.forEach(function(callback){
              callback(null, audioBuffer)
            })
          }, function(err){
            audioBufferCache[src] = null
            callbacks.forEach(function(callback){
              callback(err, null)
            })
          })
        })
      }
    } else {
      cb('Must specify src and callback')
    }
  }

  project.getFileBlob = function(src, cb){
    fs.readFile(src, 'blob', cb)
  }

  project.createFile = function(src, cb){
    fileCache[src] = null
    fs.writeFile(src, '', function(err){
      project.getFile(src, cb)
    })
  }

  return project

  /// scoped

  function deleteHandler(){
    fs.unlink(this.src)
    this.src = null
    this.set(null)
  }

}