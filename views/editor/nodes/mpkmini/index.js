var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var renderGrid = require('../launchpad/grid.js')
var renderParams = require('../launchpad/params.js')
var ControllerWidget = require('../controller-widget.js')

module.exports = function(node, setup, collection){
  if (node && setup && collection){
    return h('div MpkMiniNode', [
      h('header', [
        h('span', 'MPK Mini (' + node().port + ')'),
        h('button.remove Button -warn', {
          'ev-click': mercury.event(collection.remove, node),
        }, 'X')
      ]),
      h('section', [
        ControllerWidget(renderGrid, node, setup, collection),
        h('div.controls', renderParams(node, setup))
      ])
    ])
  } else {
    return h('div')
  }

}