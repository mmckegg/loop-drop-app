var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')
var renderRouting = require('./routing.js')

var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')

var ToggleButton = require('lib/params/toggle-button')
var RenameHook = require('lib/rename-hook')
var ObservStyleHook = require('lib/observ-style-hook')
var ObservClassHook = require('lib/observ-class-hook')

var QueryParam = require('lib/query-param')
var FlagParam = require('lib/flag-param')
var IndexParam = require('lib/index-param')
var read = require('lib/read')

module.exports = function(node, opts){
  var data = node()
  var innerData = node.resolved && node.resolved() || data

  var selectedObs = node.selected || node.node && node.node.selected
  var setup = node.context.setup
  var actions = node.context.actions

  if (data) {
    var minimised = node.minimised || QueryParam(node, 'minimised')
    var volume = node.volume || QueryParam(node, 'volume')

    return h('div ExternalNode', {
      className: data.minimised ? '-minimised' : '',
      'ev-class': ObservClassHook(selectedObs, '-selected'),
      'ev-click': send(setup.selectedChunkId.set, data.id),
      'style': ObservStyleHook(selectedObs, 'border', function (value) {
        return '2px solid ' + color(innerData.color, value ? 1 : 0)
      })
    }, [
      h('header', {
        style: ObservStyleHook(selectedObs, 'backgroundColor', function (value) {
          return color(innerData.color, value ? 0.5 : 0.1)
        })
      }, [
        h('button.twirl', {
          'ev-click': send(toggleParam, minimised)
        }),
        h('span', {'ev-rename': RenameHook(node, selectedObs, actions.updateChunkReferences)}),
        opts.extraHeader,
        opts.volume ? Range(volume, {format: 'dB', title: 'vol', defaultValue: 1, width: 150, pull: true}) : null,
        opts.external ? h('button.edit Button -edit', {
          'ev-click': send(editChunk, node)
        }, 'edit') : null,
        h('button.remove Button -warn', {
          'ev-click': send(remove, node),
        }, 'X')
      ]),
      data.minimised ? '' : opts.main
    ])
  }
  return h('UnknownNode')
}

function remove (chunk) {
  var project = chunk.context.project
  var collection = chunk.context.collection
  var fileObject = chunk.context.fileObject
  var setup = chunk.context.setup
  var descriptor = chunk()

  collection.remove(chunk)
  setup.updateChunkReferences(descriptor.id, null)

  // delete file if id matches file name and file is in cwd
  if (descriptor.id && chunk.getPath) {
    var path = chunk.getPath()
    var truePath = fileObject.resolvePath(descriptor.id + '.json')
    if (path === truePath) {
      project.actions.deleteEntry(path)
    }
  }
}

function editChunk(chunk){
  var context = chunk.context
  var fileObject = chunk.context.fileObject

  var descriptor = chunk()
  if (descriptor && descriptor.src){
    var path = fileObject.resolvePath(descriptor.src)
    context.actions.open(path)
  }
}

function toggleParam(param){
  param.set(!read(param))
}

function color(rgb, a){
  if (!Array.isArray(rgb)){
    rgb = [100,100,100]
  }
  return 'rgba(' + rgb[0] +','+rgb[1]+','+rgb[2]+','+a+')'
}
