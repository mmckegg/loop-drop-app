var h = require('lib/h')
var Select = require('lib/params/select')
var channelOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(number => [`Channel ${number}`, number])
var Range = require('lib/params/range')

module.exports = function (node) {
  return h('ParamList', [
    Select(node.outputMidiPort, {
      options: node.context.midiPorts.output,
      flex: true,
      missingPrefix: ' (disconnected)',
      includeBlank: 'No Midi Device'
    }),
    Select(node.outputMidiChannel, {
      options: channelOptions,
      flex: true
    }),
    Range(node.outputMidiTriggerOffset, {
      title: 'offset',
      defaultValue: 0,
      format: 'syncMs',
      flex: 'small'
    })
  ])
}
