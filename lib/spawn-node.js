var rename = require('lib/rename-hook').rename
var resolveAvailable = require('lib/resolve-available')
var extend = require('xtend')
var getBaseName = require('path').basename

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
    var name = 'New ' + (info.name || 'Node')
    var descriptor = (typeof info.spawn === 'function') ?
      info.spawn(context) : info.spawn

    if (info.external) {
      var path = fileObject.resolvePath(name + '.json')
      var externalDescriptor = (typeof info.external === 'function') ?
        info.external(context) : info.external
      externalDescriptor = extend({ node: nodeName }, externalDescriptor)

      resolveAvailable(path, context.fs, function (err, path) {
        context.fs.writeFile(path, JSON.stringify(externalDescriptor), function(err){
          if (err) return cb&&cb(err)
          var id = collection.resolveAvailable(getBaseName(path, '.json'))
          var finalDescriptor = extend({
            node: 'external',
            src: fileObject.relative(path),
            id: id,
            scale: '$global',
            routes: {output: '$default'}
          }, descriptor)

          var node = collection.insert(finalDescriptor, index)
          cb && cb(null, node)
        })
      })
    } else {
      var finalDescriptor = extend({
        node: nodeName
      }, descriptor)

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
