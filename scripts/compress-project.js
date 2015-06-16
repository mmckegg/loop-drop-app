var execFile = require('child_process').execFile
var each = require('async-each')
var fs = require('fs')
var extend = require('xtend/immutable')
var mkdirp = require('mkdirp')
var join = require('path').join
var dirname = require('path').dirname
var basename = require('path').basename
var extname = require('path').extname

// compress and trim all audio files
// requires ffmpeg to be in path and built with libvorbis support

compressProject(
  '/Users/matt/Projects/Destroy With Science/New Drop', 
  '/Users/matt/Projects/Destroy With Science/Compressed Drop', 
  function(err) {
    if (err) throw err
    process.exit()
  }
)

function compressProject(path, output, cb) {
  fs.exists(output, function(exists) {
    if (exists) {
      return cb&&cb(new Error("Output path already exists"))
    }
    mkdirp(output, function(err) {
      if (err) return cb&&cb(err)
      fs.readdir(path, function(err, result) {
        if (err) return cb&&cb(err)
        forEach(result, function(name, next) {
          var setupPath = join(path, name, 'index.json')
          var setupOutput = join(output, name, 'index.json')
          fs.exists(setupPath, function(exists) {
            if (exists) {
              fs.mkdir(join(output, name), function(err) {
                compressFile(setupPath, setupOutput, next)
              })
            } else {
              next()
            }
          })
        }, cb)
      })
    })
  })
}

function compressFile(path, output, cb) {
  console.log(output)
  var dir = dirname(path)
  var outputDir = dirname(output)
  fs.readFile(path, 'utf8', function(err, result) {
    if (err) return cb&&cb(err)
    var setup = JSON.parse(result)
    var chunks = []
    var audioBuffers = []
    var finalSetup = JSON.stringify(setup, function(key, value) {
      if (value && value.node === 'external' && value.src && value.id) {
        chunks.push([
          join(dir, value.src), 
          join(outputDir, value.id + '.json')
        ])
        return extend(value, {
          src: './' + value.id + '.json'
        })
      } else if (value && value.buffer && value.buffer.node === 'AudioBuffer' && value.buffer.src) {
        var start = value.offset && value.offset[0] || 0
        var end = value.offset && value.offset[1] || 1
        var ext = extname(value.buffer.src)
        var base = basename(value.buffer.src, ext)
        var newFileName = base + '_' + ms(start) + '-' + ms(end) + '.ogg'

        audioBuffers.push([
          join(dir, value.buffer.src), 
          join(outputDir, newFileName),
          start, end
        ])

        return extend(value, {
          offset: [0,1],
          buffer: extend(value.buffer, {
            src: './' + newFileName
          })
        })

      } else {
        return value
      }
    })

    fs.writeFile(output, finalSetup, function(err) {
      if (err) return cb&&cb(err)
      forEach(chunks, function(x, next) {
        compressFile(x[0], x[1], next)
      }, function(err) {
        if (err) return cb&&cb(err)
        forEach(audioBuffers, function(x, next) {
          compressAudio(x[0], x[1], x[2], x[3], next)
        }, cb)
      })
    })
  })
}

function compressAudio(path, output, start, end, cb) {
  console.log(output)
  fs.exists(output, function(exists) {
    if (!exists) {
      getAudioDuration(path, function(err, duration) {
        var from = (start||0) * duration
        var to = (end||1) * duration
        execFile('ffmpeg', [
          "-i", path, 
          "-codec:a", "libvorbis", 
          "-qscale:a", "5", 
          "-ss", from, 
          "-to", to, 
          output
        ], cb)
      })
    } else {
      cb()
    }
  })
}

function ms(s) {
  return Math.round(s * 1000)
}

function getAudioDuration(path, cb) {
  execFile("ffprobe", [
    path, 
    '-show_entries', 'format=duration', 
    '-v', 'quiet' 
  ], function(err, res) {
    if (err) return cb&&cb(err)
    var match = /duration=([0-9\.]+)\n/.exec(res)
    cb&&cb(null, parseFloat(match[1]))
  })
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