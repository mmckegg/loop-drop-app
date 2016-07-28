var h = require('lib/h')
var computed = require('@mmckegg/mutant/computed')
var watch = require('@mmckegg/mutant/watch')
var Value = require('@mmckegg/mutant/value')

module.exports = function (node) {
  var releases = []
  var unwatch = null
  var result = Value()

  if (node && node.context && node.context.nodeInfo) {
    var lookup = node.context.nodeInfo.lookup
    var nodeType = computed([node], n => n.node)
    var nodeInfo = computed([nodeType], n => lookup[node().node])

    nodeInfo(x => console.log(x))

    unwatch = watch(nodeInfo, function renderNode (info) {
      while (releases.length) {
        releases.pop()()
      }
      if (result.view) {
        result.view.destroy && result.view.destroy()
        result.view = null
      }
      if (info && info.render) {
        result.view = info.render(node)
        releases.push(watch(result.view, result.set))
      } else {
        result.set(h('UnknownNode'))
      }
    })
  }

  result.destroy = function () {
    if (unwatch) {
      unwatch()
    }

    while (releases.length) {
      releases.pop()()
    }

    if (result.view) {
      result.view.destroy && result.view.destroy()
      result.view = null
    }
  }

  return result
}
