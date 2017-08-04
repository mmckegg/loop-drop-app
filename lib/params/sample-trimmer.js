var h = require('lib/h')
var svg = require('lib/svg')
var computed = require('mutant/computed')
var watch = require('mutant/watch')
var resolve = require('mutant/watch')

var QueryParam = require('lib/query-param')

var IndexParam = require('lib/index-param')
var DomEvent = require('lib/dom-event')

var read = require('lib/read')
var getValue = require('lib/get-value')
var cancelEvent = require('lib/cancel-event')

var WaveHook = require('./wave-hook.js')
var AcceptSampleHook = require('lib/accept-sample-hook')

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
    hooks: [ AcceptSampleHook(node) ]
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
        x: computed([startOffset, 500], multiply),
        y: 0,
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
      min: 0,
      max: 1,
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
      min: 0,
      max: 1,
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
          x1: x,
          x2: x,
          y1: 0,
          y2: height
        })
      })
    }
  })
}

function parseNumber (val) {
  return parseFloat(val) || 0
}

function dragStart (ev) {
  ev.stopPropagation()
  var data = read(this.data) || {}
  if (data.buffer && data.buffer.src) {
    ev.dataTransfer.setData('loop-drop/sample-path', this.data.context.fileObject.resolvePath(data.buffer.src))
    ev.dataTransfer.setData('cwd', resolve(this.data.context.cwd))
    ev.dataTransfer.dropEffect = 'link'
  } else {
    ev.preventDefault()
  }
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

function ValueHook (obs) {
  return function (element) {
    return watch(obs, function (value) {
      element.value = value
    })
  }
}
