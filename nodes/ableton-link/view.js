var h = require('lib/h')
var send = require('mutant/send')
var computed = require('mutant/computed')
var when = require('mutant/when')
var Range = require('lib/params/range')

module.exports = renderMidiSync

function renderMidiSync (controller) {
  var collection = controller.context.collection
  var name = computed(controller, x => x.name)
  return h('GlobalControllerNode', [
    h('header', [
      h('span.name', [
        h('strong', [name, ': ']), ' ',
        plural(controller.peerCount, 'peer', 'peers')
      ]),
      h('button.remove Button -warn', {
        'ev-click': send(collection.remove, controller)
      }, 'X')
    ]),
    h('section', [
      h('ParamList', [
        Range(controller.syncOffset, {
          title: 'sync offset',
          defaultValue: 0,
          format: 'syncMs',
          flex: true
        })
      ])
    ])
  ])
}

function plural (...args) {
  return computed(args, (value, singular, plural) => {
    if (value === 1) {
      return `${value} ${singular}`
    } else {
      return `${value} ${plural}`
    }
  })
}
