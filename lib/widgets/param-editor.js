var h = require('lib/h')
var send = require('mutant/send')
var resolve = require('mutant/resolve')
var map = require('mutant/map')
var Orderable = require('lib/widgets/orderable')
var resolveAvailable = require('lib/resolve-available')

var EditableHook = require('lib/editable-hook')
var updateParamReferences = require('lib/update-param-references')

module.exports = ParamEditor

function ParamEditor (chunk) {
  var params = map(chunk.params, function (item) {
    return Orderable(item, h('ExternalNode', [
      h('header', [
        h('span.name', {
          hooks: [
            EditableHook(item, {
              formatter: (id, lastId) => {
                return resolveAvailable(chunk.context.paramLookup(), id, lastId)
              },
              onChange: onRename
            })
          ]
        }),
        h('button.remove Button -warn', {
          'ev-click': send(removeParam, {chunk: chunk, item})
        }, 'X')
      ])
    ]))
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
    EditableHook.edit(chunk.spawnParam())
    // TODO: should automatically start renaming
  }
}

function removeParam (target) {
  var key = resolve(target.item)
  target.chunk.params.remove(target.item)
  target.chunk.paramValues.delete(key)
  updateParamReferences(target.chunk, key, null)
}
