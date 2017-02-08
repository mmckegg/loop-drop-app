var h = require('lib/h')
var send = require('mutant/send')
var computed = require('mutant/computed')
var Select = require('lib/widgets/select')
var Map = require('mutant/map')
var when = require('mutant/when')

module.exports = function (collection) {
  var spawners = collection.context.project.availableGlobalControllers()
  var options = computed([
    collection, collection.context.project.availableGlobalControllers
  ], function (collection, globalControllers) {
    var result = []
    spawners.forEach(function (descriptor) {
      if (!hasNode(collection, descriptor.node)) {
        result.push([descriptor.name, descriptor])
      }
    })
    return result
  })

  var hasSpawners = computed([options], x => !!x.length)
  return h('div.controllers', [
    Map(collection, function (controller) {
      if (controller) {
        return h('GlobalControllerNode', [
          h('header', [
            h('span.name', [
              h('strong', ['Global: ']), controller().name
            ]),
            h('button.remove Button -warn', {
              'ev-click': send(collection.remove, controller)
            }, 'X')
          ])
        ])
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

function hasNode (collection, node) {
  return Array.isArray(collection) && collection.some(function (item) {
    return item && item.node === node
  })
}

function spawn (descriptor) {
  this.data.push(descriptor)
}
