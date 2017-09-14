var fs = require('fs')
var url = require('url')
var path = require('path')
var Dat = require('dat-node')
var smalltalk = require('smalltalk')
var mirror = require('mirror-folder')
var ram = require('random-access-memory')

module.exports = function (collection, index, context, fileObject, cb) {
  smalltalk.prompt('Enter Dat url', '', 'dat://').then(function (value) {
    var datDetails = url.parse(value)
    var datHash = datDetails.hostname

    var folderPath = fileObject.resolvePath(datHash)
    fetchDat(datHash, folderPath, function (err) {
      var path = fileObject.resolvePath(datHash + '/index.json')
      var externalDescriptor  = {
        node: 'Node 1',
        scale: '$global',
        node: 'externalChunk',
        src: fileObject.relative(path),
        id: 'dat ' + datHash.substring(0, 5),
        routes: {output: '$default'}
      }
      var node = collection.insert(externalDescriptor, index)
      awaitResolve(node.loaded, function () {
        cb && cb(null, node)
      })
    })
  })
}

function fetchDat(hash, folderPath, cb) {
  fs.mkdirSync(folderPath)
  Dat(ram, {key: hash, sparse: true}, function (err, dat) {
    if (err) return cb(err)
    var network = dat.joinNetwork()
    network.once('connection', function () { console.log('Connected') })
    dat.archive.metadata.update(function () {
      var progress = mirror({fs: dat.archive, name: '/'}, folderPath, function (err) {
        if (err) return cb(err)
        dat.leaveNetwork()
        dat.close(cb)
      })
      progress.on('put', function (src) {
        console.log('Downloading', src.name)
      })
    })
    console.log(`Downloading: ${dat.key.toString('hex')}\n`)
  })
}


function awaitResolve (obs, cb) {
  if (obs()) {
    cb(obs())
  } else {
    var release = obs(function (value) {
      if (release) {
        release()
        cb(value)
      }
    })
  }
}
