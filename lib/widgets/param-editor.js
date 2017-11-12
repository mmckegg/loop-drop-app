var h = require('lib/h')
var send = require('mutant/send')
var resolve = require('mutant/resolve')
var computed = require('mutant/computed')
var Orderable = require('lib/widgets/orderable')
var Struct = require('mutant/struct')

var EditableHook = require('lib/editable-hook')
var IndexParam = require('lib/index-param')
var updateParamReferences = require('lib/update-param-references')

module.exports = ParamEditor

function ParamEditor (chunk) {
  var context = {
    collection: {
      indexOf: function (value) {
        return chunk.params.indexOf(resolve(value.key))
      },
      move: function (mappedItem, targetIndex) {
        var result = resolve(chunk.params).slice()
        var currentIndex = result.indexOf(resolve(mappedItem.key))
        if (~currentIndex && currentIndex !== targetIndex) {
          var item = result[currentIndex]
          if (currentIndex < targetIndex) {
            result.splice(targetIndex + 1, 0, item)
            result.splice(currentIndex, 1)
          } else if (currentIndex > targetIndex) {
            result.splice(targetIndex, 0, item)
            result.splice(currentIndex + 1, 1)
          }
        }
        chunk.params.set(result)
      }
    }
  }
  var params = computed(chunk.params, function (params) {
    return params.map(function (key, i) {
      // HACK: allow text array to work with orderable
      var item = Struct({ key, node: 'paramName' })
      item.context = context

      return Orderable(item, h('ExternalNode', [
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
      ]))
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
  var params = resolve(target.chunk.params).slice()
  var index = params.indexOf(resolve(target.key))
  if (~index) {
    params.splice(index, 1)
  }
  target.chunk.params.set(params)
  target.chunk.paramValues.delete(target.key)
  updateParamReferences(target.chunk, target.key, null)
}
