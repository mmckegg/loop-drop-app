var h = require('micro-css/h')(require('virtual-dom/h'))
var svg = require('micro-css/h')(require('virtual-dom/virtual-hyperscript/svg'))
var send = require('value-event/event')

var randomColor = require('lib/random-color')
var ObservValueHook = require('lib/observ-value-hook')
var ObservStyleHook = require('lib/observ-style-hook')
var ToggleButton = require('lib/params/toggle-button')
var MouseDragEvent = require('lib/mouse-drag-event')

module.exports = RecordingView

function RecordingView (recording) {
  return h('RecordingNode', [
    
    h('div.main', [
      ArrangementTimeline(recording)
    ]),
    
    h('div.options', [
      h('section', [
        ToggleButton(recording.playing, {
          classList: ['-main'],
          title: 'Play'
        })
      ]),
      h('section', [
        h('button', {
          'ev-click': send(recording.exportFile, 'wave')
        }, 'Export PCM Wave')
      ])
    ])
  
  ])
}

function ArrangementTimeline (recording) {
  var widthMultiplier = recording.scale()
  var duration = recording.duration()
  var finalWidth = duration * widthMultiplier

  return h('ArrangementTimeline', [
    h('div.content', {
      style: {
        width: finalWidth + 'px'
      }
    }, [
      renderSvgTimeline(duration, widthMultiplier),
      h('input', {
        type: 'range', 
        min: 0, 
        max: duration, 
        style: {
          width: finalWidth + 'px' 
        },
        step: 0.01, 
        value: ObservValueHook(recording.position)
      }),
      h('div.cursor', {
        style: ObservStyleHook(recording.position, 'left', function(value) {
          return (value) * widthMultiplier + 'px'
        })
      }),

      h('div.timeline', {
        style: {
          width: finalWidth + 'px'
        }
      }, [
        h('div.primary', [
          recording.timeline.primary.map(function (clip) {
            return h('div.clip', {
              tabIndex: 0,
              style: {
                width: clip.duration.resolved() * widthMultiplier + 'px'
              }
            }, [
              h('div.trim -start', {
                'ev-mousedown': MouseDragEvent(handleTrimStart, clip)
              }),
              h('div.trim -end', {
                'ev-mousedown': MouseDragEvent(handleTrimEnd, clip)
              })
            ])
          })
        ])
      ])
    ])
  ])
}

function handleTrimEnd(ev) {
  var clip = this.data
  var widthMultiplier = clip.context.recording.scale()
  if (ev.type === 'mousedown'){
    this.lastOffset = 0
    this.startValue = clip.duration.resolved()
    this.start = ev
  } else if (this.start) {
    var offset = (ev.x - this.start.x) / widthMultiplier
    if (this.lastOffset !== offset){
      var duration = Math.min(Math.max(0, this.startValue + offset), clip.duration.max())
      clip.duration.set(duration)
      this.lastOffset = offset
    }
  }
}

function handleTrimStart(ev) {
  var clip = this.data
  var widthMultiplier = clip.context.recording.scale()
  if (ev.type === 'mousedown'){
    this.lastOffset = 0
    this.duration = clip.duration.resolved()
    this.startOffset = clip.startOffset()
    this.start = ev
  } else if (this.start) {
    var offset = ev.offsetX / widthMultiplier
    if (this.lastOffset !== offset){
      var startOffset = Math.min(Math.max(0, this.startOffset + offset), clip.startOffset.max())
      clip.startOffset.set(startOffset)
      clip.duration.set(this.duration + (this.startOffset - startOffset))
      console.log(clip.duration(), clip.startOffset())
      this.lastOffset = offset
    }
  }
}

function renderSvgTimeline (length, widthMultiplier) {
  var elements = []
  var xOffset = 6

  for (var i=0;i<length;i+=1) {
    var x = i * widthMultiplier + xOffset
    elements.push(svg('line', {
      x1: x, x2: x, y1: 0, y2: i % 5 ? 3 : 12,
      stroke: 'rgba(255,255,255,0.5)'
    }))

    if (i % 5 === 0) {
      var val = formatTime(i)
      elements.push(svg('text', {
        x: x+3, y: 5
      }, val))
    }
  }

  var fullWidth = length * widthMultiplier + xOffset

  return svg('svg', {
    width: fullWidth,
    viewBox: '0 0 ' + fullWidth + ' 16'
  }, elements)
}


function toCssAlpha(rgb, alpha) {
  return 'rgba(' + rgb.join(',') + ',' + alpha + ')'
}

function formatTime (value) {
  var minutes = Math.floor(value / 60)
  var seconds = Math.round(value % 60)
  return minutes + ':' + ('0'+seconds).slice(-2)
}