var h = require('lib/h')
var renderRouting = require('lib/widgets/routing')
var renderChunk = require('lib/widgets/chunk')
var renderParams = require('lib/widgets/params')
var ToggleButton = require('lib/params/toggle-button')
var QueryParam = require('lib/query-param')
var FlagParam = require('lib/flag-param')

module.exports = function (node) {
  var flags = QueryParam(node, 'flags')
  return renderChunk(node, {
    volume: true,
    external: true,
    main: [
      h('section', [
        renderParams(node),
        h('ParamList', [
          h('div -block', [
            h('div.extTitle', 'Use Global'),
            h('ParamList -compact', [
              ToggleButton(FlagParam(flags, 'noRepeat'), {
                title: 'Repeat',
                onValue: false,
                offValue: true
              })
            ])
          ]),
          renderRouting(node)
        ])
      ])
    ]
  })
}
