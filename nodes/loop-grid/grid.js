var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')
var MPE = require('lib/mouse-position-event')
var MouseDragEvent = require('lib/mouse-drag-event')
var nextTick = require('next-tick')
var getBaseName = require('path').basename
var GridStateHook = require('./grid-state-hook.js')
var read = require('lib/read')

var QueryParam = require('lib/query-param')

module.exports = function renderGrid (controller) {
  var context = controller.context
  var setup = context.setup
  var chunks = getChunks(controller)
  var playback = controller.playback
  var shape = playback.shape()

  var rows = []
  for (var r=0;r<shape[0];r++){
    var buttons = []
    for (var c=0;c<shape[1];c++){
      buttons.push(h('div.button', {
        'ev-dragenter': MPE(enterButton, controller),
        'ev-dragleave': MPE(leaveButton, controller)
      }))
    }
    rows.push(h('div.row', buttons))
  }

  return h('LoopGrid', {
    className: shape[1] > 16 ? '-min' : '',
    'ev-dragover': MPE(dragOver, controller),
    'ev-drop': MPE(drop, controller),
    'ev-dragleave': MPE(dragLeave, controller),
    'ev-dragenter': MPE(dragEnter, controller),
  }, [
    h('div.rows', {'ev-state': GridStateHook(controller.gridState)}, rows),
    h('div.chunks', chunks.map(function(chunk){
      return renderChunkBlock(chunk, controller)
    }))
  ])

}

function renderChunkBlock(chunk, controller){
  var setup = controller.context.setup
  var shape = controller.playback.shape()

  var selectedChunkId = setup.selectedChunkId()
  var box = {
    top: chunk.origin[0] / shape[0],
    bottom: (chunk.origin[0] + chunk.shape[0]) / shape[0],
    left: chunk.origin[1] / shape[1],
    right: (chunk.origin[1] + chunk.shape[1]) / shape[1]
  }

  var style = {
    'top': percent(box.top),
    'height': percent(box.bottom - box.top),
    'left': percent(box.left),
    'width': percent(box.right - box.left),
    'border-color': color(chunk.color, 1),
    'background-color': color(chunk.color, 0.1),
    'color': color(mixColor(chunk.color, [255,255,255]),1)
  }

  var node = setup.chunks.lookup.get(chunk.id)

  return h('div.chunk', { 
    className: selectedChunkId == chunk.id ? '-selected' : null, 
    style: style,
    draggable: true,
    'ev-click': send(selectChunk, { chunkId: chunk.id, controller: controller }),
    'ev-dblclick': send(toggleChunk, node),
    'ev-dragstart': MPE(startDrag, node),
    'ev-dragend': MPE(endDrag, node)
  },[
    h('span.label', chunk.id),
    chunk.resizable ? [
      h('div.handle -bottom', {
        draggable: true,
        'ev-mousedown': MouseDragEvent(resize, { edge: 'bottom', node: node, shape: shape })
      }),
      h('div.handle -right', {
        draggable: true,
        'ev-mousedown': MouseDragEvent(resize, { edge: 'right', node: node, shape: shape })
      })
    ] : null
  ])
}

function resize(ev){
  var edge = this.data.edge
  var node = this.data.node
  var shape = this.data.shape

  if (ev.type === 'mousedown'){
    this.lastOffset = 0
    this.startValue = QueryParam(node, 'shape').read()
    this.start = ev
  } else if (this.start) {
    if (edge === 'bottom'){
      var offset = Math.round((ev.y - this.start.y) / 30)
      if (this.lastOffset !== offset){
        QueryParam(node, 'shape').set([ clamp1(this.startValue[0]+offset), this.startValue[1] ])
        this.lastOffset = offset
      }
    } else if (edge === 'right'){
      var offset = Math.round((ev.x - this.start.x) / (248 / shape[1]))
      if (this.lastOffset !== offset){
        QueryParam(node, 'shape').set([ this.startValue[0], clamp1(this.startValue[1]+offset) ])
        this.lastOffset = offset
      }
    }
  }

}

function clamp1(val){
  return Math.max(val, 1)
}

function getChunks(controller){
  var context = controller.context
  var chunkPositions = controller.chunkPositions ? controller.chunkPositions() : {}
  var chunks = []
  for (var k in chunkPositions){

    var chunk = context.chunkLookup.get(k)

    if (chunk){
      var data = chunk()
      chunks.push({
        id: data.id,
        color: data.color,
        shape: data.shape,
        origin: chunkPositions[k],

        // HACK: find a better way to detect/set this
        resizable: !!chunk.templateSlot || !chunk.slots

      })
    }

  }
  return chunks
}

function enterButton(ev) {
  ev.currentTarget.classList.add('-dragOver')
}

function leaveButton(ev) {
  ev.currentTarget.classList.remove('-dragOver')
}

function startDrag(ev){
  window.currentDrag = ev
}

function endDrag(ev){
  window.currentDrag = null
}

var entering = null
function dragLeave(ev){
  var controller = ev.data
  if (window.currentDrag && (!entering || entering !== controller)){
    var chunkId = getId(currentDrag.data)
    if (chunkId){
      controller.chunkPositions.delete(chunkId)
    }
  }
}
function dragEnter(ev){
  entering = ev.data

  setTimeout(function(){
    entering = null
  }, 1)
}

function getId(chunk){
  if (typeof chunk== 'function'){
    chunk = chunk()
  }

  if (chunk){
    return chunk.id
  }
}

function dragOver(ev){
  var controller = ev.data
  var currentDrag = window.currentDrag

  if (currentDrag){

    var chunkId = getId(currentDrag.data)

    if (chunkId){
      var shape = controller.playback.shape()
      var height = ev.offsetHeight / shape[0]
      var width = ev.offsetWidth / shape[1]

      var x = ev.offsetX - currentDrag.offsetX
      var y = ev.offsetY - currentDrag.offsetY

      var r = Math.round(y/width)
      var c = Math.round(x/width)

      var currentValue = controller.chunkPositions.get(chunkId)

      if (!currentValue || currentValue[0] !== r || currentValue[1] !== c){
        controller.chunkPositions.put(chunkId, [r,c])
      }
    }

    ev.dataTransfer.dropEffect = 'move'
    ev.event.preventDefault()  
  }

  if (~ev.dataTransfer.types.indexOf('filepath')){
    ev.dataTransfer.dropEffect = 'copy'
    ev.event.preventDefault()
  }
}

function drop(ev){
  var path = ev.dataTransfer.getData('filepath')
  var controller = ev.data
  var actions = controller.context.actions
  var setup = controller.context.setup
  var fileObject = setup.context.fileObject

  if (path && setup && setup.chunks){

    actions.importChunk(path, setup.context.cwd, function(err, newPath) {
      if (err) throw err

      var id = getBaseName(newPath, '.json')
      setup.chunks.push({
        'node': 'external',
        'id': id,
        'src': fileObject.relative(newPath),
        'minimised': true,
        'routes': {output: '$default'},
        'scale': '$global'
      })
      
      var shape = controller.playback.shape()
      var height = ev.offsetHeight / shape[0]
      var width = ev.offsetWidth / shape[1]
      var r = Math.floor(ev.offsetY/height)
      var c = Math.floor(ev.offsetX/width)
      controller.chunkPositions.put(id, [r,c])
    })

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
    (a[0] + a[0] + b[0]) / 3,
    (a[1] + a[0] + b[1]) / 3,
    (a[2] + a[0] + b[2]) / 3
  ]
}

function toggleChunk(chunk){
  var minimised = chunk.minimised || QueryParam(chunk, 'minimised')
  minimised.set(!read(minimised))
}

function selectChunk(target){
  var controller = target.controller
  var setup = controller.context.setup
  var actions = controller.context.actions
  controller.grabInput && controller.grabInput()
  setup.selectedChunkId.set(target.chunkId)
  actions.scrollToSelectedChunk()
}
