var h = require('lib/h')
var send = require('value-event/event')

var EditableHook = require('lib/editable-hook')
var IndexParam = require('lib/index-param')
var updateParamReferences = require('lib/update-param-references')

module.exports = ParamEditor

var renameLastParam = false

function ParamEditor(chunk){
  var keys = chunk.params()
  var params = keys.map(function(key, i){
    var selected = renameLastParam && i === keys.length-1
    return h('ExternalNode', [
      h('header', [
        h('span.name', {
          'ev-hook': EditableHook(IndexParam(chunk.params, i), selected, onRename)
        }),
        h('button.remove Button -warn', {
          'ev-click': send(removeParam, {chunk: chunk, key: key}),
        }, 'X')
      ])
    ])
  })

  return [
    params,

    h('NodeSpawner', h('button Button -main -spawn', {
      'ev-click': send(spawnParam, chunk)
    }, '+ param'))
  ]
}

function onRename (lastValue, value, param) {
  updateParamReferences(param.context.chunk, lastValue, value)
}

function spawnParam(chunk) {
  var key = chunk.resolveAvailableParam('New Param')
  var params = chunk.params().slice()
  params.push(key)
  chunk.params.set(params)

  // wow such hacks!
  renameLastParam = true
  setTimeout(function() {
    renameLastParam = false
  }, 16)
}

function removeParam(target) {
  var params = target.chunk.params().slice()
  var index = params.indexOf(target.key)
  if (~index) {
    params.splice(index, 1)
  }
  target.chunk.params.set(params)
  updateParamReferences(target.chunk, target.key, null)
}
