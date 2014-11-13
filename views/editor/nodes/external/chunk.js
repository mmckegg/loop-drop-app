var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var MPE = require('../../../../lib/mouse-position-event.js')
var renderRouting = require('./routing.js')

module.exports = function(node, setup, collection){
  var data = node()
  var innerData = node.resolved() || {}

  if (data){

    var selected = setup.selectedChunkId() == data.id
    var headerStyle = 'background-color:'+color(innerData.color, selected ? 0.5 : 0.1)
    var mainStyle = 'border: 2px solid '+color(innerData.color, selected ? 1 : 0)

    return h('div ExternalNode', {
      draggable: true,
      'ev-dragstart': MPE(dragStart, {chunk: node, collection: collection}),
      'ev-dragend': MPE(dragEnd, {chunk: node, collection: collection, setup: setup}),
      'ev-dragover': MPE(dragOver, {chunk: node, collection: collection, setup: setup}),
      'ev-click': mercury.event(setup.selectedChunkId.set, data.id),
      'style': AttributeHook(mainStyle)
    }, [
      h('header', {
        style: AttributeHook(headerStyle)
      }, [
        h('span', innerData.id),
        h('button.remove Button -warn', {
          'ev-click': mercury.event(collection.remove, node),
        }, 'X')
      ]),
      h('section', [
        renderRouting(node, setup, collection)
      ])
    ])
  }
  return h('UnknownNode')
}

function color(rgb, a){
  if (!Array.isArray(rgb)){
    rgb = [100,100,100]
  }
  return 'rgba(' + rgb[0] +','+rgb[1]+','+rgb[2]+','+a+')'
}

function AttributeHook(value) {
  if (!(this instanceof AttributeHook)) {
    return new AttributeHook(value);
  }
  this.value = value;
}

AttributeHook.prototype.hook = function (node, prop, prev) {
  if (prev && prev.value === this.value) {
    return;
  }
  node.setAttributeNS(null, prop, this.value)
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