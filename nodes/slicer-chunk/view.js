var h = require('lib/h')
var renderRouting = require('lib/widgets/routing')
var FlagParam = require('lib/flag-param')
var renderChunk = require('lib/widgets/chunk')
var SampleTrimmer = require('lib/params/sample-trimmer')
var SampleChooser = require('lib/params/sample-chooser')
var ToggleButton = require('lib/params/toggle-button')
var QueryParam = require('lib/query-param')

module.exports = function renderSlicerChunk (node) {
  var flags = QueryParam(node, 'flags')
  return renderChunk(node, {
    volume: true,
    main: [
      SampleChooser(node),
      SampleTrimmer(node),
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
        h('div -block', [
          h('div.extTitle', 'Choke Mode'),
          h('ParamList -compact', [
            ToggleButton(node.chokeAll, {
              title: 'All', offTitle: 'Single'
            })
          ])
        ]),
        renderRouting(node)
      ])
    ]
  })
}