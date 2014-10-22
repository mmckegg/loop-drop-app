var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var MPE = require('../../../../lib/mouse-position-event.js')
var getBaseName = require('path').basename
var nextTick = require('next-tick')

module.exports = renderGrid
function renderGrid(controller, setup){
  var data = controller && controller.gridState()

  if (data){
    var grid = data.grid
    var chunks = data.chunks
    var selectedChunkId = setup.selectedChunkId()
    var selectedTriggerId = setup.selectedTriggerId()

    if (grid && chunks){
      var buttons = []
      var length = grid.shape[0] * grid.shape[1]
      for (var r=0;r<grid.shape[0];r++){
        for (var c=0;c<grid.shape[1];c++){
          var classes = '.button'
          var buttonState = grid.get(r,c)
          if (buttonState){
            classes += ' -present'
            if (buttonState.isPlaying) classes += ' -playing'
            if (buttonState.isRecording) classes += ' -recording'
            if (buttonState.isActive) classes += ' -active'
            if (buttonState.noRepeat) classes += ' -noRepeat'
            if (selectedTriggerId === buttonState.id) classes += ' -selected'
          }

          buttons.push(h('div', {
            className: classes
          }))
        }
      }

      return h('div.grid', {
        'ev-dragover': MPE(dragOver, {controller: controller, setup: setup}),
        'ev-drop': MPE(drop, {controller: controller, setup: setup}),
        'ev-dragleave': MPE(dragLeave, {controller: controller, setup: setup}),
        'ev-dragenter': MPE(dragEnter, {controller: controller, setup: setup})
      }, [
        buttons,
        chunks.map(function(chunk){
          return renderChunkBlock(chunk, grid.shape, grid.stride, controller, setup)
        })
      ])
    }
  }
}

function renderChunkBlock(chunk, shape, stride, controller, setup){
  var selectedChunkId = setup.selectedChunkId()
  var box = {
    top: chunk.origin[0] / shape[0],
    bottom: (chunk.origin[0] + chunk.shape[0]) / shape[0],
    left: chunk.origin[1] / shape[1],
    right: (chunk.origin[1] + chunk.shape[1]) / shape[1]
  }

  var style = 'top:'+percent(box.top)+
              ';height:'+percent(box.bottom - box.top)+
              ';left:'+percent(box.left)+
              ';width:'+percent(box.right - box.left)+
              ';border-color:'+color(chunk.color, 1)+
              ';background-color:'+color(chunk.color, 0.1)+
              ';color:'+color(mixColor(chunk.color, [255,255,255]),1)

  return h('div.chunk', { 
    className: selectedChunkId == chunk.id ? '-selected' : null, 
    style: AttributeHook(style),
    draggable: true,
    'ev-click': mercury.event(setup.selectedChunkId.set, chunk.id),
    'ev-dragstart': MPE(startDrag, {chunk: chunk, controller: controller}),
    'ev-dragend': MPE(endDrag, {chunk: chunk, controller: controller})
  },[
    h('span.label', chunk.id),
    //h('div.handle -top'),
    //h('div.handle -bottom'),
    //h('div.handle -left'),
    //h('div.handle -right'),
    h('div.handle -move')
  ])
}

function startDrag(ev){
  window.currentDrag = ev
  ev.value = ev.data.chunk.origin.slice()
  ev.controller = ev.data.controller
  console.log('start', ev)
}

function endDrag(ev){
  window.currentDrag = null
}

var entering = null
function dragLeave(ev){
  if (window.currentDrag && (!entering || entering !== ev.data.controller)){
    console.log('LEAVE')
    var chunkId = getId(currentDrag.data.chunk)
    if (chunkId){
      ev.data.controller.chunkPositions.delete(chunkId)
    }
  }
}
function dragEnter(ev){
  entering = ev.data.controller
  nextTick(function(){
    entering = null
  })
}

function getId(chunk){
  if (typeof currentDrag.data.chunk == 'function'){
    chunk = currentDrag.data.chunk()
  }

  if (chunk){
    return chunk.id
  }
}

function dragOver(ev){
  var currentDrag = window.currentDrag

  if (currentDrag){

    var chunkId = getId(currentDrag.data.chunk)
    if (chunkId){
      var height = ev.offsetHeight / ev.data.controller.grid().shape[0]
      var width = ev.offsetWidth / ev.data.controller.grid().shape[1]

      if (!currentDrag.controller){
        currentDrag.controller = ev.data.controller
      }

      if (currentDrag.controller !== ev.data.controller){
        currentDrag.controller.chunkPositions.delete(chunkId)
        currentDrag.controller = ev.data.controller
      }

      var x = ev.offsetX - currentDrag.offsetX
      var y = ev.offsetY - currentDrag.offsetY

      var r = Math.round(y/width)
      var c = Math.round(x/width)

      if (!currentDrag.value || currentDrag.value[0] !== r || currentDrag.value[1] !== c){
        currentDrag.value = [r,c]
        ev.data.controller.chunkPositions.put(chunkId, currentDrag.value)
      }
    }

    ev.dataTransfer.dropEffect = 'move'
    ev.event.preventDefault()
    
  }

  if (~ev.dataTransfer.types.indexOf('filesrc')){
    ev.dataTransfer.dropEffect = 'link'
    ev.event.preventDefault()
  }
}

function drop(ev){
  var src = ev.dataTransfer.getData('filesrc')
  if (src && ev.data.setup && ev.data.setup.chunks){

    var lookup = ev.data.setup.chunks.controllerContextLookup()
    var base = getBaseName(src, '.json')
    var incr = 0
    var id = base

    while (lookup[id]){
      incr += 1
      id = base + ' ' + (incr + 1)
    }

    ev.data.setup.chunks.push({
      'node': 'external',
      'id': id,
      'src': src
    })
    
    var height = ev.offsetHeight / ev.data.controller.grid().shape[0]
    var width = ev.offsetWidth / ev.data.controller.grid().shape[1]
    var r = Math.floor(ev.offsetY/height)
    var c = Math.floor(ev.offsetX/width)
    ev.data.controller.chunkPositions.put(id, [r,c])
  }

}

function getElementMouseOffset(offsetX, offsetY, clientX, clientY){
  return [clientX - offsetX, clientY - offsetY]
}

function getOffset(start, end, size){
  var difference = (end - start) / size
  return Math.round(difference)
}

function percent(decimal){
  return (decimal * 100) + '%'
}

function color(rgb, a){
  if (!Array.isArray(rgb)){
    rgb = [100,100,100]
  }
  return 'rgba(' + rgb[0] +','+rgb[1]+','+rgb[2]+','+a+')'
}

function mixColor(a, b){
  if (!Array.isArray(a)){
    return b
  }
  return [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
    (a[2] + b[2]) / 2
  ]
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