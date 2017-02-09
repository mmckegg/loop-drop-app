var h = require('lib/h')
var send = require('mutant/send')
var computed = require('mutant/computed')

var EditableHook = require('lib/editable-hook')
var IndexParam = require('lib/index-param')
var updateParamReferences = require('lib/update-param-references')

module.exports = ParamEditor

function ParamEditor (chunk) {
  var params = computed(chunk.params, function (params) {
    return params.map(function (key, i) {
      return h('ExternalNode', [
        h('header', [
          h('span.name', {
            hooks: [
              EditableHook(IndexParam(chunk.params, i), { onChange: onRename })
            ]
          }),
          h('button.remove Button -warn', {
            'ev-click': send(removeParam, {chunk: chunk, key: key})
          }, 'X')
        ])
      ])
    })
  })

  return [
    params,
    h('NodeSpawner', h('button Button -main -spawn', {
      'ev-click': send(spawnParam, chunk)
    }, '+ param'))
  ]
}

function onRename (lastValue, value, param) {
  updateParamReferences(param.context.externalChunk, lastValue, value)
}

function spawnParam (chunk) {
  if (chunk.spawnParam) {
    chunk.spawnParam()
    // TODO: should automatically start renaming
  }
}

function removeParam (target) {
  var params = target.chunk.params().slice()
  var index = params.indexOf(target.key)
  if (~index) {
    params.splice(index, 1)
  }
  target.chunk.params.set(params)
  updateParamReferences(target.chunk, target.key, null)
}
