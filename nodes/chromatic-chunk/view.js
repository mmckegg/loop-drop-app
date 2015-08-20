var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')

var renderCollection = require('lib/widgets/collection')
var ParamEditor = require('lib/widgets/param-editor')

var Range = require('lib/params/range')
var ToggleButton = require('lib/params/toggle-button')
var ScaleChooser = require('lib/params/scale-chooser')
var IndexParam = require('lib/index-param')
var QueryParam = require('lib/query-param')
var EditableHook = require('lib/editable-hook')
var renderNode = require('lib/render-node')

module.exports = renderChromaticChunk

function renderChromaticChunk(chunk){
  return h('ChunkNode', [
    h('div.options', [
      
      h('h1', 'Slots'),
      TemplateSlotChooser(chunk),

      h('h1', 'Chunk Options'),
      h('section.options', [
        h('ParamList', [
          h('div -block', [
            h('div.extTitle', 'Choke Mode'),
            h('div', ToggleButton(chunk.chokeAll, {title: 'All', offTitle: 'Single'}))
          ])
        ])
      ]),

      h('h1', 'Scale'),
      renderScaleChooser(chunk),

      h('h1', 'Params'),
      ParamEditor(chunk)
    ]),

    h('div.slot', [
      currentSlotEditor(chunk)
    ])
  ])
}

function renderScaleChooser(node){
  return h('ParamList -compact', [
    ScaleChooser(QueryParam(node.scale, 'notes', {})),
    Range(QueryParam(node.scale, 'offset', {}), {
      title: 'offset', 
      format: 'semitone', 
      defaultValue: 0, 
      width: 200, 
      flex: true
    })
  ])
}


function currentSlotEditor(chunk){
  var slotId = chunk.selectedSlotId()
  if (slotId === '$template'){
    return renderNode(chunk.templateSlot.node)
  } else {
    var slots = chunk.context.slotLookup
    var slot = slots.get(slotId)
    if (slot){
      return renderNode(slot)
    }
  }
}

function TemplateSlotChooser(chunk){

  var triggers = []

  var shape = chunk.shape() || [1,1]
  var selectedSlotId = chunk.selectedSlotId()
  var slots = chunk.context.slotLookup

  triggers.push(
    h('div.slot', {
      'className': selectedSlotId === '$template' ? '-selected' : '',
      'ev-click': send(selectTemplateSlot, chunk)
    }, 'template trigger')
  )

  return h('SlotChooser', [
    triggers, 
    h('div.spacer'),
    h('div.slot -output', {
      'className': selectedSlotId === 'output' ? '-selected' : '',
      'ev-click': send(chunk.selectedSlotId.set, 'output')
    }, 'output')
  ])
}

function selectTemplateSlot (chunk) {
  var data = chunk.templateSlot()
  if (!data || !data.node){
    chunk.templateSlot.set({
      id: { $param: 'id' },
      noteOffset: {
        node: 'modulator/scale', 
        value: { $param: 'value'}, 
        offset: { $param: 'offset' },  
        scale: { $param: 'scale' }
      },
      node: 'slot', 
      output: 'output' 
    })
  }
  chunk.selectedSlotId.set('$template')
}
