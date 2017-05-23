var bind = require('lib/bind-event')
var read = require('lib/read')
var importSample = require('lib/import-sample')
var QueryParam = require('lib/query-param')

module.exports = AcceptSampleHook

function AcceptSampleHook (node) {
  return function (element) {
    var releases = [
      bind(element, 'dragover', dragOver),
      bind(element, 'dragleave', dragLeave),
      bind(element, 'drop', {
        handleEvent: drop,
        data: node
      })
    ]
    return function () {
      while (releases.length) {
        releases.pop()()
      }
    }
  }
}

function dragOver (ev) {
  ev.stopPropagation()
  var item = ev.dataTransfer.items[0]
  if (item && item.kind === 'file' && item.type.match(/^(audio|video)\//)) {
    ev.currentTarget.classList.add('-dragOver')
    ev.dataTransfer.dropEffect = 'copy'
    ev.preventDefault()
  } else if (ev.dataTransfer.types.includes('loop-drop/sample-path')) {
    ev.currentTarget.classList.add('-dragOver')
    ev.dataTransfer.dropEffect = 'link'
    ev.preventDefault()
  }
}

function dragLeave (ev) {
  ev.currentTarget.classList.remove('-dragOver')
}

function drop (ev) {
  var node = this.data
  var data = read(node)
  var context = this.data.context
  var item = ev.dataTransfer.items[0]

  ev.preventDefault()
  dragLeave(ev)

  var currentPath = data.buffer && data.buffer.src && node.context.fileObject.resolvePath(data.buffer.src) || null

  var path = item.kind === 'file'
    ? ev.dataTransfer.items[0].getAsFile().path
    : ev.dataTransfer.getData('loop-drop/sample-path')

  if (path && path !== currentPath) {
    importSample(context, path, function (err, descriptor) {
      if (err) throw err
      for (var k in descriptor) {
        QueryParam(node, k).set(descriptor[k])
      }
    })
  }
}
