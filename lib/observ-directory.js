var Observ = require('mutant/value')
var join = require('path').join
var Event = require('geval')
var MutantMap = require('mutant/map')

module.exports = ObservDirectory

function ObservDirectory (path, fs, cb) {
  var entries = Observ([])
  var refreshing = false
  var watcher = null

  var obs = MutantMap(entries, (file) => {
    return {
      type: 'directory',
      path: join(path, file),
      fileName: file
    }
  })

  obs.path = path

  var broadcastClose = null
  obs.onClose = Event((broadcast) => {
    broadcastClose = broadcast
  })

  obs.refresh = function () {
    if (!refreshing) {
      refreshing = true
      setTimeout(refresh, 100)
    }
  }

  obs.close = function () {
    broadcastClose()
    if (watcher) {
      watcher.close()
      watcher = null
    }
  }

  refresh(true)

  fs.stat(path, function (_, stats) {
    if (stats && stats.isDirectory() && fs.watch) {
      obs.watcher = fs.watch(obs.path)
      obs.watcher.on('change', obs.refresh)
    }
  })

  return obs

  // scoped

  function refresh (init) {
    refreshing = false
    var current = entries()
    getDirectories(path, fs, (err, dirs) => {
      if (err) return init && cb && cb(err)
      if (dirs.length !== current.length || !dirs.every(x => current.includes(x))) {
        dirs.sort((a, b) => a.localeCompare(b))
        entries.set(dirs)
      }
      if (init) {
        cb && cb(null, obs)
      }
    })
  }
}

function getDirectories (path, fs, cb) {
  fs.readdir(path, (err, files) => {
    if (err) return cb && cb(err)
    var remaining = files.length
    var thrown = false
    var result = []
    files.forEach(file => fs.stat(join(path, file), (err, stats) => {
      if (thrown) return
      if (err) {
        thrown = true
        return cb && cb(err)
      }
      remaining -= 1
      if (stats.isDirectory() && checkFileName(file)) {
        result.push(file)
      }

      if (!remaining) {
        cb(null, result)
      }
    }))
  })
}

function checkFileName (name) {
  return name.charAt(0) !== '.' && name.charAt(0) !== '~'
}
