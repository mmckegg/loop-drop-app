var h = require('lib/h')
var when = require('mutant/when')
var renderChunk = require('lib/widgets/chunk')
var renderRouting = require('lib/widgets/routing')
var renderParams = require('lib/widgets/params')
var renderMidiOutputOptions = require('lib/widgets/midi-output')
var ToggleButton = require('lib/params/toggle-button')
var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')

var FlagParam = require('lib/flag-param')
var IndexParam = require('lib/index-param')

module.exports = renderExternalChromaticChunk

function renderExternalChromaticChunk (external) {
  var node = external.node
  return renderChunk(external, {
    volume: true,
    external: true,
    main: [
      h('section', [
        h('ParamList', [
          h('div -block -flexSmall', [
            h('div', Range(IndexParam(external.shape, 0), {
              title: 'rows',
              format: 'bit',
              defaultValue: 1
            }))
          ]),
          h('div -block -flexSmall', [
            h('div', Range(IndexParam(external.shape, 1), {
              title: 'cols',
              format: 'bit',
              defaultValue: 1
            }))
          ])
        ]),
        h('ParamList', [
          ModRange(external.offset, {
            title: 'offset',
            format: 'semitone',
            flex: true,
            allowSpawnModulator: true,
            defaultValue: 0
          })
        ]),
        renderParams(external),
        h('ParamList', [
          h('div -block', [
            h('div.extTitle', 'Use Global'),
            h('ParamList -compact', [
              ToggleButton(FlagParam(external.flags, 'noRepeat'), {
                title: 'Repeat',
                onValue: false,
                offValue: true
              }),
              ToggleButton(node.scale, {
                title: 'Scale',
                offValue: undefined,
                onValue: '$global'
              })
            ])
          ]),
          renderRouting(external)
        ])
      ]),
      when(node.midiOutputEnabled, [
        h('h1', 'Midi Output'),
        h('section', [
          renderMidiOutputOptions(external)
        ])
      ])
    ]
  })
}
