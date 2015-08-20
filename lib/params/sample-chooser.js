var h = require('micro-css/h')(require('virtual-dom/h'))
var FileEvent = require('lib/file-event')
var QueryParam = require('lib/query-param')

var importSample = require('lib/import-sample')

module.exports = SampleChooser

function SampleChooser(node, opts){
  return h('input SampleChooser', {
    type: 'file',
    accept: 'audio/wave',
    'ev-change': FileEvent(handleChange, node)
  })
}

function handleChange(file){
  var node = this.data
  var context = this.data.context

  importSample(context, file, function(err, descriptor){
    for (var k in descriptor){
      QueryParam(node, k).set(descriptor[k])
    }
  })
}