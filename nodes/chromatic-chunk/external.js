var h = require('lib/h')
var renderChunk = require('lib/widgets/chunk')
var renderRouting = require('lib/widgets/routing')
var renderParams = require('lib/widgets/params')
var ToggleButton = require('lib/params/toggle-button')
var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')

var QueryParam = require('lib/query-param')
var FlagParam = require('lib/flag-param')
var IndexParam = require('lib/index-param')

module.exports = renderExternalChromaticChunk

function renderExternalChromaticChunk (node) {
  var flags = QueryParam(node, 'flags')
  var shape = QueryParam(node, 'shape')
  var offset = QueryParam(node, 'offset')

  return renderChunk(node, {
    volume: true,
    external: true,
    main: [
      h('section', [
        h('ParamList', [
          h('div -block -flexSmall', [
            h('div', Range(IndexParam(shape, 0), {
              title: 'rows',
              format: 'bit',
              defaultValue: 1
            }))
          ]),
          h('div -block -flexSmall', [
            h('div', Range(IndexParam(shape, 1), {
              title: 'cols',
              format: 'bit',
              defaultValue: 1
            }))
          ])
        ]),
        h('ParamList', [
          ModRange(offset, {
            title: 'offset',
            format: 'semitone',
            flex: true,
            allowSpawnModulator: true,
            node: node,
            defaultValue: 0
          })
        ]),
        renderParams(node),
        h('ParamList', [
          h('div -block', [
            h('div.extTitle', 'Use Global'),
            h('ParamList -compact', [
              ToggleButton(FlagParam(flags, 'noRepeat'), {
                title: 'Repeat',
                onValue: false,
                offValue: true
              }),
              ToggleButton(QueryParam(node, 'scale'), {
                title: 'Scale',
                offValue: undefined,
                onValue: '$global'
              })
            ])
          ]),
          renderRouting(node)
        ])
      ])
    ]
  })
}
