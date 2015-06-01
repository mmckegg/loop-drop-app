var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')
var ToggleButton = require('lib/params/toggle-button')
var RenameHook = require('lib/rename-hook')

var IndexParam = require('lib/index-param')
var FlagParam = require('lib/flag-param')

module.exports = function(node){
  var setup = node.context.setup
  var actions = node.context.actions
  var collection = node.context.collection
  var slotLookup = node.context.slotLookup

  var selected = setup.selectedChunkId() == node.id()
  var headerStyle = {
    backgroundColor: color(node.color(), selected ? 0.5 : 0.1)
  }
  var mainStyle = {
    border: '2px solid '+color(node.color(), selected ? 1 : 0)
  }

  var classNames = [] 
  if (node.minimised()) classNames.push('-minimised')
  if (selected) classNames.push('-selected')

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
    className: classNames.join(' '),
    'ev-click': mercury.event(setup.selectedChunkId.set, node.id()),
    'style': mainStyle
  }, [
    h('header', {
      style: headerStyle
    }, [
      h('button.twirl', {
        'ev-click': mercury.event(toggleParam, node.minimised)
      }),
      h('span', [
        h('span', {'ev-hook': RenameHook(node, selected, actions.updateChunkReferences)}), 
        ' (modulator)'
      ]),
      h('button.remove Button -warn', {
        'ev-click': mercury.event(collection.remove, node),
      }, 'X')
    ]),
    node.minimised() ? '' : h('section', [
      h('div ParamList', [
        shapeParams(node.shape),
        ToggleButton(FlagParam(node.flags, 'noRepeat'), {
          title: 'Use Repeat', 
          onValue: false,
          offValue: true 
        })
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