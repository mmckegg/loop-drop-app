var h = require('lib/h')
var Header = require('lib/widgets/header')

var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')
var channelOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(number => [`Channel ${number}`, number])

module.exports = function renderMidiOut (node) {
  return h('SourceNode -midiOut', [
    Header(node, h('span', [
      h('strong', 'MIDI Note Output:'), ' ',
      h('span', node.port)
    ])),
    h('ParamList', [
      Select(node.port, {
        options: node.context.midiPorts.output,
        flex: true,
        missingPrefix: ' (disconnected)',
        includeBlank: 'No Midi Device'
      }),
      Select(node.channel, {
        options: channelOptions,
        flex: true
      }),
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
      }),
      Range(node.triggerOffset, {
        title: 'trigger offset',
        defaultValue: 0,
        format: 'syncMs',
        flex: true
      })
    ])
  ])
}
