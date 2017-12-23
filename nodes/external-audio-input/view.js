var h = require('lib/h')
var send = require('mutant/send')
var when = require('mutant/when')
var computed = require('mutant/computed')
var ToggleButton = require('lib/params/toggle-button')

module.exports = renderExternalAudioInput

function renderExternalAudioInput (controller) {
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
        ToggleButton(controller.includeInRecording, {
          title: 'Include in recording'
        }),
        ToggleButton(controller.monitor, {
          title: 'Monitor'
        })
      ])
    ])
  ])
}

function toggleParam (param) {
  param.set(!param())
}
