var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var renderRouting = require('./routing.js')

var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')

var ToggleButton = require('lib/params/toggle-button')
var RenameHook = require('lib/rename-hook')

var QueryParam = require('loop-drop-project/query-param')
var FlagParam = require('lib/flag-param')
var IndexParam = require('lib/index-param')

module.exports = function(node){
  var data = node()
  var innerData = node.resolved() || {}

  var setup = node.context.setup
  var collection = node.context.collection
  var actions = node.context.actions

  if (data){

    var selected = setup.selectedChunkId() == data.id
    var headerStyle = {
      backgroundColor: color(innerData.color, selected ? 0.5 : 0.1)
    }
    var mainStyle = {
      border: '2px solid '+color(innerData.color, selected ? 1 : 0)
    }

    var minimised = QueryParam(node, 'minimised')
    var volume = QueryParam(node, 'volume', null, node.context)
    var flags = QueryParam(node, 'flags')
    var offset = QueryParam(node, 'offset')

    var isScale = innerData.node === 'chunk/scale'

    var classNames = [] 
    if (data.minimised) classNames.push('-minimised')
    if (selected) classNames.push('-selected')

    return h('div ExternalNode', {
      className: classNames.join(' '),
      'ev-click': mercury.event(setup.selectedChunkId.set, data.id),
      'style': mainStyle
    }, [
      h('header', {
        style: headerStyle
      }, [
        h('button.twirl', {
          'ev-click': mercury.event(toggleParam, minimised)
        }),
        h('span', {'ev-rename': RenameHook(node, selected, actions.updateChunkReferences)}),
        Range(volume, {format: 'dB', title: 'vol', defaultValue: 1, width: 150, pull: true}),
        h('button.edit Button -edit', {
          'ev-click': mercury.event(editChunk, node)
        }, 'edit'),
        h('button.remove Button -warn', {
          'ev-click': mercury.event(collection.remove, node),
        }, 'X')
      ]),
      data.minimised ? '' : h('section', [

        // shape chooser
        isScale ? [
          h('ParamList', [
            shapeParams(QueryParam(node, 'shape'))
          ]),
          h('ParamList', [
            ModRange(offset, {
              title: 'offset',
              format: 'semitone', 
              flex: true
            })
          ])
        ]: null,

        Params(node),

        h('ParamList', [

          h('div -block', [
            h('div.extTitle', 'Use Global'),
            h('ParamList -compact', [

              ToggleButton(FlagParam(flags, 'noRepeat'), {
                title: 'Repeat', 
                onValue: false,
                offValue: true 
              }),

              isScale ? ToggleButton(QueryParam(node, 'scale'), {
                title: 'Scale', 
                offValue: undefined,
                onValue: '$global'
              }) : null

            ])
          ]),
          
          renderRouting(node)
        ])

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

function updateChunkReferences(hook){
  var chunk = hook.object
  var setup = chunk.context.setup
  setup.updateChunkReferences(hook.lastValue, hook.value)
}

function toggleParam(param){
  param.set(!param.read())
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

function Params(node) {
  var paramValues = QueryParam(node, 'paramValues')
  var params = QueryParam(node, 'params').read()
  if (params instanceof Array) {
    return params.map(function(key) {
      return h('ParamList', [
        ModRange(QueryParam(paramValues, key), {
          title: key,
          format: 'offset', 
          flex: true
        })
      ])
    })
  }
}

function color(rgb, a){
  if (!Array.isArray(rgb)){
    rgb = [100,100,100]
  }
  return 'rgba(' + rgb[0] +','+rgb[1]+','+rgb[2]+','+a+')'
}