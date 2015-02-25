var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var Range = require('../params/range.js')
var ModRange = require('../params/mod-range.js')
var ToggleButton = require('../params/toggle-button.js')

var IndexParam = require('../params/index-param.js')

module.exports = function(node){
  var setup = node.context.setup
  var collection = node.context.collection
  var slotLookup = node.context.slotLookup

  var selected = setup.selectedChunkId() == node.id()
  var headerStyle = {
    backgroundColor: color(node.color(), selected ? 0.5 : 0.1)
  }
  var mainStyle = {
    border: '2px solid '+color(node.color(), selected ? 1 : 0)
  }

  var className = node.minimised() ? '-minimised' : ''

  var elements = []
  var shape = node.shape()
  var length = shape[0] * shape[1]
  for (var i=0;i<length;i++){
    var id = String(i)
    var slot = slotLookup.get(id)
    if (slot){
      elements.push(h('div.slot -trigger', [
        h('strong', id + ': '),
        ModRange(slot.value, { flex: true, format: 'offset' }),
        h('button.remove Button -warn', {
          'ev-click': mercury.event(node.slots.remove, slot),
        }, 'X')
      ]))
    } else {
      elements.push(h('div.slot -spawn', {
        'ev-click': mercury.event(spawnSlot, { id: id, collection: node.slots })
      }, [ '+ trigger']))
    }
  }

  return h('div ExternalNode', {
    className: className,
    'ev-click': mercury.event(setup.selectedChunkId.set, node.id()),
    'style': mainStyle
  }, [
    h('header', {
      style: headerStyle
    }, [
      h('button.twirl', {
        'ev-click': mercury.event(toggleParam, node.minimised)
      }),
      h('span', [node.id(), ' (modulator)']),
      h('button.remove Button -warn', {
        'ev-click': mercury.event(collection.remove, node),
      }, 'X')
    ]),
    node.minimised() ? '' : h('section', [
      h('div ParamList', [
        shapeParams(node.shape)
      ]),

      h('ValueSlots', elements)
    ])
  ])
}

function shapeParams(param){
  return [
    h('div -block -flexSmall', [
      h('div', Range(IndexParam(param, 0), { 
        title: 'rows',
        format: 'bit',
        defaultValue: 1
      }))
    ]),

    h('div -block -flexSmall', [
      h('div', Range(IndexParam(param, 1), { 
        title: 'cols',
        format: 'bit',
        defaultValue: 1
      }))
    ])
  ]
}

function spawnSlot(ev){
  var id = ev.id
  var collection = ev.collection
  collection.push({
    node: 'slot/value',
    id: ev.id,
    value: 0
  })
}

function toggleParam(param){
  param.set(!param())
}

function color(rgb, a){
  if (!Array.isArray(rgb)){
    rgb = [100,100,100]
  }
  return 'rgba(' + rgb[0] +','+rgb[1]+','+rgb[2]+','+a+')'
}