var forEach = require('mutant/for-each')
var forEachPair = require('mutant/for-each-pair')

module.exports = watchNodesChanged

function watchNodesChanged (collectionOrLookup, fn) {
  var nodes = new global.Set()
  return collectionOrLookup(function (value) {
    var currentItems = new global.Set()
    var changed = false

    if (Array.isArray(value)) {
      forEach(collectionOrLookup, function (item) {
        currentItems.add(item)
        if (!nodes.has(item)) {
          nodes.add(item)
          changed = true
        }
      })
    } else {
      forEachPair(collectionOrLookup, function (key, item) {
        currentItems.add(item)
        if (!nodes.has(item)) {
          nodes.add(item)
          changed = true
        }
      })
    }

    Array.from(nodes.values()).forEach(function (node) {
      if (!currentItems.has(node)) {
        nodes.delete(node)
        changed = true
      }
    })

    if (changed) {
      fn()
    }
  })
}
