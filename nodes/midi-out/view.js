var h = require('lib/h')
var Header = require('lib/widgets/header')
var ModRange = require('lib/params/mod-range')

module.exports = function renderMidiOut (node) {
  return h('SourceNode -midiOut', [
    Header(node, h('span', [
      h('strong', 'MIDI Note Output')
    ])),
    h('ParamList', [
      ModRange(node.note, {
        title: 'pitch',
        format: 'midi',
        defaultValue: 69,
        flex: true
      }),
      ModRange(node.velocity, {
        title: 'velocity',
        defaultValue: 100,
        format: 'midi',
        flex: true
      }),
      ModRange(node.aftertouch, {
        title: 'aftertouch',
        defaultValue: 0,
        format: 'midi',
        flex: true
      })
    ])
  ])
}
