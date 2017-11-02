var h = require('lib/h')
var send = require('mutant/send')
var computed = require('mutant/computed')
var Select = require('lib/widgets/select')
var Map = require('mutant/map')
var when = require('mutant/when')

module.exports = function (collection) {
  var context = collection.context
  var options = computed([
    collection, context.project.availableGlobalControllers
  ], function (collection, globalControllers) {
    var result = []
    Object.keys(globalControllers).forEach(key => {
      var info = context.nodeInfo.lookup[key]
      if (info.portMatch) {
        var items = []
        globalControllers[key].forEach(descriptor => {
          if (!hasNode(collection, descriptor)) {
            items.push([descriptor.port, descriptor])
          }
        })
        if (items.length && info) {
          result.push([info.name, items])
        }
      } else {
        result.push([info.name, {
          name: info.name,
          node: info.node
        }])
      }
    })
    return result
  })

  var hasSpawners = computed([options], x => !!x.length)
  return h('div.controllers', [
    Map(collection, function (controller) {
      if (controller) {
        var info = context.nodeInfo.lookup[controller().node]
        if (info.render) {
          return info.render(controller)
        } else {
          var name = computed(controller, x => x.name)
          var port = controller.port
          return h('GlobalControllerNode', [
            h('header', [
              h('span.name', [
                h('strong', name), when(shouldShowPort(port, name), [h('br'), port])
              ]),
              h('button.remove Button -warn', {
                'ev-click': send(collection.remove, controller)
              }, 'X')
            ])
          ])
        }
      }
    }),
    when(hasSpawners, h('div.spawn', [
      Select(spawn, collection, {
        includeBlank: 'Add Global Controller...',
        options: options
      })
    ]))
  ])
}

function shouldShowPort (port, name) {
  return computed([port, name], (port, name) => {
    return port && port !== name
  })
}

function hasNode (collection, spawner) {
  return Array.isArray(collection) && collection.some(function (item) {
    return item && item.node === spawner.node && item.port === spawner.port
  })
}

function spawn (descriptor) {
  this.data.push(descriptor)
}
