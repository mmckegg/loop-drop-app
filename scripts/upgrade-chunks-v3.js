var fs = require('fs')
var join = require('path').join
var getDirectory = require('path').dirname

upgradeProject('/Users/matt/Code/loop-drop-app/demo-project', function (err) {
  if (err) {
    throw err
  } else {
    console.log('done')
  }
})

function upgradeProject (projectPath, cb) {
  fs.readdir(projectPath, function (err, result) {
    if (err) return cb && cb(err)
    forEach(result, function (name, next) {
      var setupPath = join(projectPath, name, 'index.json')
      fs.exists(setupPath, function (exists) {
        if (exists) {
          upgradeSetup(setupPath, next)
        } else {
          next()
        }
      })
    }, cb)
  })
}

function upgradeSetup (setupPath, cb) {
  console.log('upgrading', setupPath)
  var setupDirectory = getDirectory(setupPath)
  fs.readFile(setupPath, 'utf8', function (err, result) {
    if (err) return cb && cb(err)
    var data = JSON.parse(result)
    if (data.chunks) {
      forEach(data.chunks, function (chunk, next, i) {
        if (chunk.node === 'external') {
          var chunkPath = join(setupDirectory, chunk.src)
          data.chunks[i] = { node: 'externalChunk', src: chunk.src }
          console.log(' > ', chunk.src)
          fs.readFile(chunkPath, 'utf8', function (err, result) {
            if (err) return next && next(err)
            var params = JSON.parse(result)
            Object.keys(chunk).forEach(function (key) {
              if (key !== 'node' && key !== 'src') {
                params[key] = chunk[key]
              }
            })
            fs.writeFile(chunkPath, JSON.stringify(params), next)
          })
        } else {
          next()
        }
      }, function (err) {
        if (err) return cb && cb(err)
        fs.writeFile(setupPath, JSON.stringify(data), cb)
      })
    } else {
      console.log('no chunk', setupPath)
      cb()
    }
  })
}

function forEach (array, fn, cb) {
  var i = -1
  function next (err) {
    if (err) return cb && cb(err)
    i += 1
    if (i < array.length) {
      fn(array[i], next, i)
    } else {
      cb && cb(null)
    }
  }
  next()
}
