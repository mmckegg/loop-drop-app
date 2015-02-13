var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var svg = require('micro-css/h')(require('mercury/node_modules/virtual-dom/virtual-hyperscript/svg'))

var QueryParam = require('loop-drop-setup/query-param')
var IndexParam = require('./index-param.js')
var WaveHook = require('./wave-hook.js')

var read = require('./read.js')
var change = require('./value-event.js')

var getValue = require('./get-value.js')

module.exports = function(node){
  var data = read(node) || {}
  var offset = QueryParam(node, 'offset')

  var startOffset = data.offset && data.offset[0] || 0
  var endOffset = (data.offset && data.offset[1] != null) ? data.offset[1] : 1

  var gainValue = getValue(data.gain, 1)

  var range = endOffset - startOffset

  return h('SampleTrimmer', [

    svg('svg WaveView', {
      'viewBox': '0 0 500 400',
      'preserveAspectRatio': 'none'
    }, [

      svg('path.wave', {
        style: {
          fill: '#AAA'
        },
        'ev-hook': WaveHook(node, 500, 400) 
      }),

      svg('rect.section', {
        x: startOffset * 500, y: 0, 
        width: range * 500, 
        height: 400, 
        style: {
          fill: 'rgba(142, 255, 126, 0.38)' 
        }
      }),

      svg('path.baseline', {
        d: 'M0,200 L500,200',
        style: {
          strokeWidth:2, 
          stroke: '#AAA'
        }
      })

    ]),

    h('input.start', {
      type: 'range',
      value: new ValueHook(startOffset),
      min: 0, max: 1, 
      step: 0.00125,
      'ev-input': change(handleChange, 'value', IndexParam(offset, 0))
    }),

    h('input.end', {
      type: 'range', 
      value: new ValueHook(endOffset),
      min: 0, max: 1, 
      step: 0.00125,
      'ev-input': change(handleChange, 'value', IndexParam(offset, 1))
    })

  ])
}

function getGainTransform(value){
  var offsetHeight = (((currentHeightScale*height) - height) / 2) / currentHeightScale
  return 'scale(' + currentWidthScale + ' ' + currentHeightScale + ') translate(0 ' + -offsetHeight + ')'
}

function handleChange(value){
  this.data.set(value)
}

function ValueHook(value){
  this.value = value
}

ValueHook.prototype.hook = function(node, prop, prev){
  if (!prev || prev.value !== this.value){
    if (prev){
      node[prop] = this.value
    } else {
      node.setAttribute(prop, this.value)
    }
  }
}