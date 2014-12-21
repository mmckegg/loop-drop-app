var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var MPE = require('../../../../lib/mouse-position-event.js')
var renderRouting = require('./routing.js')
var range = require('../../params/range.js')
var QueryParam = require('../../../../lib/query-param.js')

module.exports = function(node, setup, collection){
  var data = node()
  var innerData = node.resolved() || {}

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
      draggable: true,
      className: className,
      'ev-dragstart': MPE(dragStart, {chunk: node, collection: collection}),
      'ev-dragend': MPE(dragEnd, {chunk: node, collection: collection, setup: setup}),
      'ev-dragover': MPE(dragOver, {chunk: node, collection: collection, setup: setup}),
      'ev-dblclick': mercury.event(setup.requestEditChunk, data.id),
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
        range(volume, {format: 'dB', title: 'vol', width: 150, pull: true}),
        h('button.remove Button -warn', {
          'ev-click': mercury.event(collection.remove, node),
        }, 'X')
      ]),
      data.minimised ? '' : h('section', [
        renderRouting(node, setup, collection)
      ])
    ])
  }
  return h('UnknownNode')
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

function dragOver(ev){
  var currentDrag = window.currentDrag
  if (currentDrag && currentDrag.data.chunk){
    var index = ev.data.collection.indexOf(ev.data.chunk)
    if (~index){
      ev.data.collection.move(currentDrag.data.chunk, index)
    }
  }
}

function dragStart(ev){
  window.currentDrag = ev
}

function dragEnd(ev){
  window.currentDrag = null
}