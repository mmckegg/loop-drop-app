var h = require('lib/h')
var svg = require('lib/svg')
var computed = require('@mmckegg/mutant/computed')
var watch = require('@mmckegg/mutant/watch')

var QueryParam = require('lib/query-param')

var IndexParam = require('lib/index-param')
var DomEvent = require('lib/dom-event')

var read = require('lib/read')
var getValue = require('lib/get-value')
var importSample = require('lib/import-sample')
var cancelEvent = require('lib/cancel-event')

var WaveHook = require('./wave-hook.js')

module.exports = function (node) {
  var offset = node.offset || QueryParam(node, 'offset')
  var gain = node.amp || QueryParam(node, 'amp')

  var startOffset = computed(offset, o => o && o[0] || 0)
  var endOffset = computed(offset, o => (o && o[1] != null) ? o[1] : 1)
  var gainValue = computed([gain, 1], getValue)
  var range = computed([endOffset, startOffset], subtract)

  return h('SampleTrimmer', {
    draggable: true,
    'ev-dragstart': DomEvent(dragStart, node),
    'ev-dragover': DomEvent(dragOver, node),
    'ev-dragleave': DomEvent(dragLeave, node),
    'ev-drop': DomEvent(drop, node)
  }, [
    svg('svg WaveView', {
      'viewBox': '0 0 500 400',
      'preserveAspectRatio': 'none'
    }, [
      svg('path.wave', {
        style: {
          fill: '#AAA'
        },
        hooks: [
          WaveHook(node, gainValue, 500, 400)
        ]
      }),

      svg('rect.section', {
        x: computed([startOffset, 500], multiply), y: 0,
        width: computed([range, 500], multiply),
        height: 400,
        style: {
          fill: 'rgba(142, 255, 126, 0.38)'
        }
      }),

      slicesSvg(node.slices, 500, 400),

      svg('path.baseline', {
        d: 'M0,200 L500,200',
        style: {
          strokeWidth: 2,
          stroke: '#AAA'
        }
      })

    ]),

    h('input.start', {
      draggable: true,
      'ev-dragstart': cancelEvent(),
      type: 'range',
      min: 0, max: 1,
      step: 0.00125,
      'ev-input': DomEvent(handleChange, IndexParam(offset, 0, parseNumber)),
      hooks: [
        ValueHook(startOffset)
      ]
    }),

    h('input.end', {
      draggable: true,
      'ev-dragstart': cancelEvent(),
      type: 'range',
      min: 0, max: 1,
      step: 0.00125,
      'ev-input': DomEvent(handleChange, IndexParam(offset, 1, parseNumber)),
      hooks: [
        ValueHook(endOffset)
      ]
    })

  ])
}

function slicesSvg (slices, width, height) {
  return computed([slices], function (slices) {
    if (slices) {
      return slices.map(function (slice) {
        var x = slice[0] * width
        return svg('line', {
          stroke: 'rgba(0,0,0,0.4)',
          'stroke-width': '3px',
          x1: x, x2: x, y1: 0, y2: height
        })
      })
    }
  })
}

function parseNumber (val) {
  return parseFloat(val) || 0
}

function dragStart (ev) {
  var data = read(this.data) || {}
  if (data.buffer && data.buffer.src) {
    ev.dataTransfer.setData('loop-drop/sample-path', ev.data.context.fileObject.resolvePath(data.buffer.src))
    ev.dataTransfer.setData('cwd', ev.data.context.cwd)
    ev.dataTransfer.dropEffect = 'link'
  } else {
    ev.preventDefault()
  }
}

function dragOver (ev) {
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

function getGainTransform(value){
  var offsetHeight = (((currentHeightScale*height) - height) / 2) / currentHeightScale
  return 'scale(' + currentWidthScale + ' ' + currentHeightScale + ') translate(0 ' + -offsetHeight + ')'
}

function handleChange (event) {
  this.data.set(event.currentTarget.value)
}

function multiply (a, b) {
  return a * b
}

function subtract (a, b) {
  return a - b
}


function noop(){}

function ValueHook (obs) {
  return function (element) {
    return watch(obs, function (value) {
      element.value = value
    })
  }
}
