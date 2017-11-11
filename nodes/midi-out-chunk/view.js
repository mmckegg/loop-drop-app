var h = require('lib/h')
var FlagParam = require('lib/flag-param')
var renderChunk = require('lib/widgets/chunk')
var ToggleButton = require('lib/params/toggle-button')
var IndexParam = require('lib/index-param')
var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')
var send = require('mutant/send')
var map = require('mutant/map')
var resolve = require('mutant/resolve')

var channelOptions = getRange(1, 16).map(number => [`Channel ${number}`, number])
var ccOptions = getRange(0, 119).map(number => [`CC ${number}`, number])

module.exports = function renderMidiOutChunk (node) {
  var ccSlots = map(node.continuousControllers, slot => {
    return h('div.slot -trigger', [
      Select(slot.code, {
        options: ccOptions,
        flex: true
      }),
      ModRange(slot.value, {
        flex: true,
        format: 'midi',
        defaultValue: 0,
        allowSpawnModulator: true
      }),
      h('button.remove Button -warn', {
        'ev-click': send(node.continuousControllers.remove, slot)
      }, 'X')
    ])
  })

  return renderChunk(node, {
    volume: false,
    main: [
      h('section', [

        h('ParamList', [
          h('div -block -flexSmall', [
            h('div', Range(IndexParam(node.shape, 0), {
              title: 'rows',
              format: 'bit',
              defaultValue: 1
            }))
          ]),
          h('div -block -flexSmall', [
            h('div', Range(IndexParam(node.shape, 1), {
              title: 'cols',
              format: 'bit',
              defaultValue: 1
            }))
          ]),
          ToggleButton(FlagParam(node.flags, 'noRepeat'), {
            title: 'Use Repeat',
            onValue: false,
            offValue: true
          })
        ])
      ]),

      h('h1', 'Output'),
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
        ModRange(node.offset, {
          title: 'scale offset',
          format: 'semitone',
          flex: 'small',
          allowSpawnModulator: true,
          defaultValue: 0
        }),
        ModRange(node.pitchBend, {
          title: 'pitch bend',
          format: 'offset1',
          flex: 'small',
          allowSpawnModulator: true,
          defaultValue: 0
        }),
        ModRange(node.globalAftertouch, {
          title: 'channel aftertouch',
          defaultValue: 0,
          format: 'midi',
          flex: true
        })
      ]),

      h('h1', 'Midi Note'),
      h('section', [
        h('ParamList', [
          ModRange(node.noteOffset, {
            title: 'note offset',
            format: 'semitone',
            defaultValue: 0,
            flex: true
          }),
          ModRange(node.octave, {
            title: 'octave',
            format: 'octave',
            defaultValue: 0,
            flex: true
          }),
          ModRange(node.velocity, {
            title: 'velocity',
            defaultValue: 100,
            format: 'midi',
            flex: true
          }),
          ModRange(node.aftertouch, {
            title: 'polyphonic aftertouch',
            defaultValue: 0,
            format: 'midi',
            flex: true
          })
        ])
      ]),

      h('h1', 'Params'),
      h('section', [
        h('ValueSlots', [
          ccSlots,
          h('div.slot -spawn', {
            'ev-click': send(spawnCC, { collection: node.continuousControllers })
          }, ['+ MIDI CC'])
        ])
      ])
    ]
  })
}

function getRange (min, max) {
  var result = []
  for (var i = min; i <= max; i++) {
    result.push(i)
  }
  return result
}

function spawnCC (ev) {
  var collection = ev.collection
  collection.push({
    node: 'slot/midi-cc',
    code: lastCode(collection) + 1,
    value: 0
  })
}

function lastCode (collection) {
  if (collection && collection.get && collection.getLength && collection.getLength()) {
    var last = collection.get(collection.getLength() - 1)
    if (last && last.code) {
      return resolve(last.code)
    }
  }
  return 0
}
