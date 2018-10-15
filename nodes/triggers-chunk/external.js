var h = require('lib/h')
var renderRouting = require('lib/widgets/routing')
var renderChunk = require('lib/widgets/chunk')
var renderParams = require('lib/widgets/params')
var renderMidiOutputOptions = require('lib/widgets/midi-output')
var ToggleButton = require('lib/params/toggle-button')
var FlagParam = require('lib/flag-param')

module.exports = function (external) {
  return renderChunk(external, {
    volume: true,
    external: true,
    main: [
      h('section', [
        renderParams(external),
        h('ParamList', [
          h('div -block', [
            h('div.extTitle', 'Use Global'),
            h('ParamList -compact', [
              ToggleButton(FlagParam(external.flags, 'noRepeat'), {
                title: 'Repeat',
                onValue: false,
                offValue: true
              })
            ])
          ]),
          renderRouting(external)
        ])
      ]),

      h('h1', 'Midi Output'),
      h('section', [
        renderMidiOutputOptions(external)
      ])
    ]
  })
}
