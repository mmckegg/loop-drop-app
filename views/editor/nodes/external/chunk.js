var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var renderRouting = require('./routing.js')
var range = require('../../params/range.js')
var QueryParam = require('loop-drop-setup/query-param.js')

module.exports = function(node){
  var data = node()
  var innerData = node.resolved() || {}

  var setup = node.context.setup
  var collection = node.context.collection

  if (data){

    var selected = setup.selectedChunkId() == data.id
    var headerStyle = {
      backgroundColor: color(innerData.color, selected ? 0.5 : 0.1)
    }
    var mainStyle = {
      border: '2px solid '+color(innerData.color, selected ? 1 : 0)
    }

    var minimised = QueryParam(node, 'minimised')
    var className = data.minimised ? '-minimised' : ''
    var volume = QueryParam(node, 'volume')

    return h('div ExternalNode', {
      className: className,
      'ev-dblclick': mercury.event(editChunk, node),
      'ev-click': mercury.event(setup.selectedChunkId.set, data.id),
      'style': mainStyle
    }, [
      h('header', {
        style: headerStyle
      }, [
        h('button.twirl', {
          'ev-click': mercury.event(toggleParam, minimised)
        }),
        h('span', innerData.id),
        range(volume, {format: 'dB', title: 'vol', defaultValue: 1, width: 150, pull: true}),
        h('button.remove Button -warn', {
          'ev-click': mercury.event(collection.remove, node),
        }, 'X')
      ]),
      data.minimised ? '' : h('section', [
        renderRouting(node)
      ])
    ])
  }
  return h('UnknownNode')
}

function editChunk(chunk){
  var context = chunk.context
  var descriptor = chunk()
  if (descriptor && descriptor.src){
    var path = context.project.resolve([context.cwd||'', descriptor.src])
    context.actions.open(path)
  }
}

function toggleParam(param){
  param.set(!param.read())
}

function color(rgb, a){
  if (!Array.isArray(rgb)){
    rgb = [100,100,100]
  }
  return 'rgba(' + rgb[0] +','+rgb[1]+','+rgb[2]+','+a+')'
}