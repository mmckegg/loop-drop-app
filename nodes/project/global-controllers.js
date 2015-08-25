var h = require('lib/h')
var send = require('value-event/event')
var Select = require('lib/widgets/select')

module.exports = function (collection) {
  var spawners = collection.context.project.availableGlobalControllers()
  var options = [] 

  spawners.forEach(function (descriptor) {
    if (!hasNode(collection, descriptor.node)) {
      options.push([descriptor.name, descriptor])
    }
  })

  return h('div.controllers', [
    collection.map(function (controller) {
      return h('GlobalControllerNode', [
        h('header', [
          h('span.name', [
            h('strong', ['Global: ']), controller().name
          ]),
          h('button.remove Button -warn', {
            'ev-click': send(collection.remove, controller),
          }, 'X')
        ])
      ])
    }),

    options.length ? h('div.spawn', [
      Select(spawn, collection, {
        includeBlank: 'Add Global Controller...',
        options: options
      })
    ]) : null
  ])
}

function hasNode (collection, node) {
  return collection().some(function (item) {
    return item.node === node
  })
}

function spawn (descriptor) {
  this.data.push(descriptor)
}