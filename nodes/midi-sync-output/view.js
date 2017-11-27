var h = require('lib/h')
var send = require('mutant/send')
var when = require('mutant/when')
var computed = require('mutant/computed')

module.exports = renderMidiSync

function renderMidiSync (controller) {
  var collection = controller.context.collection
  var name = computed(controller, x => x.name)
  var port = controller.port
  return h('GlobalControllerNode', {
    classList: [
      when(controller.minimised, '-minimised')
    ]
  }, [
    h('header', [
      h('button.twirl', {
        'ev-click': send(toggleParam, controller.minimised)
      }),
      h('span.name', [
        h('strong', name), when(port, [': ', port])
      ]),
      h('button.remove Button -warn', {
        'ev-click': send(collection.remove, controller)
      }, 'X')
    ]),
    h('section', [
      h('ParamList', [
        h('ModParam', [
          h('button.action', {'ev-click': send(controller.startSync)}, 'Send Start'), ' ',
          h('button.action', {
            'ev-click': send(controller.stop),
            style: {'margin-left': '5px'}
          }, 'Send Stop')
        ])
      ])
    ])
  ])
}

function toggleParam (param) {
  param.set(!param())
}
