var h = require('lib/h')
var renderChunk = require('lib/widgets/chunk')
var renderRouting = require('lib/widgets/routing')
var renderParams = require('lib/widgets/params')
var ToggleButton = require('lib/params/toggle-button')
var QueryParam = require('loop-drop-project/query-param')
var FlagParam = require('lib/flag-param')

module.exports = function(node){
  var flags = QueryParam(node, 'flags')
  return renderChunk(node, {
    volume: true,
    external: true,
    main: [
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
    ]
  })
}