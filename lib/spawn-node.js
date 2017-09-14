var resolveAvailable = require('lib/resolve-available')
var extend = require('xtend')
var getBaseName = require('path').basename
var createDatNode = require('./create-dat-node')

module.exports = function (collection, nodeName, index, cb) {
  if (typeof index === 'function') {
    cb = index
    index = null
  }

  if (index == null) {
    index = collection.getLength()
  }

  var context = collection.context
  var fileObject = context.fileObject
  var lookup = context.nodeInfo.lookup
  var info = lookup[nodeName]
  if (info) {
    if (info.name === 'dat') return createDatNode(collection, index, context, fileObject, cb)
    var name = (info.name || 'Node') + ' 1'
    var spawnDescriptor = (typeof info.spawn === 'function')
      ? info.spawn(context)
      : info.spawn

    if (info.external) {
      var externalDescriptor = (typeof info.external === 'function')
        ? info.external(context)
        : info.external

      var path = fileObject.resolvePath(name + '.json')
      resolveAvailable(path, context.fs, function (err, path) {
        if (err) return cb && cb(err)
        var id = collection.resolveAvailable(getBaseName(path, '.json'))

        spawnDescriptor = extend({
          node: nodeName,
          scale: '$global'
        }, spawnDescriptor)

        externalDescriptor = extend({
          node: 'externalChunk',
          src: fileObject.relative(path),
          id: id,
          routes: {output: '$default'}
        }, typeof externalDescriptor === 'object' ? externalDescriptor : null)

        context.fs.writeFile(path, JSON.stringify(spawnDescriptor), function (err) {
          if (err) return cb && cb(err)
          var node = collection.insert(externalDescriptor, index)
          awaitResolve(node.loaded, function () {
            cb && cb(null, node)
          })
        })
      })
    } else {
      var finalDescriptor = extend({
        node: nodeName
      }, spawnDescriptor)

      if (collection.resolveAvailable) {
        finalDescriptor.id = collection.resolveAvailable(name)
      }

      var node = collection.insert(finalDescriptor, index)
      cb && cb(null, node)
    }
  } else {
    cb && cb(new Error('No node exists with specified name.'))
  }
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
