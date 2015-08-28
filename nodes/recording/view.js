var h = require('lib/h')
var svg = require('micro-css/h')(require('virtual-dom/virtual-hyperscript/svg'))
var ev = require('lib/dom-event')
var send = require('value-event/event')
var KeyEvent = require('value-event/key')

var randomColor = require('lib/random-color')
var ObservValueHook = require('lib/observ-value-hook')
var ObservStyleHook = require('lib/observ-style-hook')
var ToggleButton = require('lib/params/toggle-button')
var MouseDragEvent = require('lib/mouse-drag-event')
var ZoomEvent = require('lib/zoom-event')
var WaveHook = require('lib/wave-hook')
var getClosestPoint = require('lib/get-closest-point')

module.exports = RecordingView

function RecordingView (recording) {
  return h('RecordingNode', [
    
    h('div.main', {
      tabIndex: 0,
      'ev-keydown': ev(handleTimelineKeyEvent, recording)
    }, [
      ArrangementTimeline(recording)
    ]),
    
    h('div.options', [

      recording.rendering() ? h('progress', {
        min: 0,
        max: 1,
        value: ObservValueHook(recording.renderProgress)
      }) : null,

      h('section Transport', [
        h('button -beginning', {
          'ev-click': send(goToBeginning, recording)
        }),
        ToggleButton(recording.playing, {
          custom: true,
          classList: ['-play']
        }),
        h('button.splice', {
          'title': 'splice',
          'ev-click': send(recording.splice, true)
        }, ']|[')
      ]),
      h('section Clock', [
        h('span.hours', {
          textContent: ObservValueHook(recording.position, getPaddedHours)
        }, '00'),
        ':',
        h('span.minutes', {
          textContent: ObservValueHook(recording.position, getPaddedMinutes)
        }, '00'),
        ':',
        h('span.seconds', {
          textContent: ObservValueHook(recording.position, getPaddedSeconds)
        }, '00'),
        '.',
        h('span.fraction', {
          textContent: ObservValueHook(recording.position, getPaddedFraction)
        }, '00'),
      ]),
      h('section', [
        h('button.export', {
          'ev-click': send(recording.exportFile, 'wave')
        }, 'Export Wave')
      ])
    ])
  
  ])
}

function ArrangementTimeline (recording) {
  var widthMultiplier = recording.scale()
  var duration = recording.duration() + 1
  var finalWidth = duration * widthMultiplier

  return h('ArrangementTimeline', {
    'ev-mousewheel': ZoomEvent(handleZoom, recording)
  }, [
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
        style: ObservStyleHook(recording.position, 'transform', function(value) {
          return 'translateX(' + (value) * recording.scale() + 'px)'
        })
      }),

      h('div.timeline', {
        style: {
          width: finalWidth + 'px'
        }
      }, [
        h('div.primary', [
          recording.timeline.primary.map(function (clip) {
            var waveScaler = (40 / widthMultiplier) * widthMultiplier
            return h('div.clip', {
              tabIndex: 0,
              'ev-keydown': ev(handleClipKeyEvent, clip), //bcksp
              style: {
                width: clip.duration.resolved() * widthMultiplier + 'px'
              }
            }, [
              svg('svg', {
                width: clip.duration.resolved() * widthMultiplier,
                height: 100,
                viewBox: viewBox(
                  clip.startOffset() * waveScaler, 0,
                  clip.duration.resolved() * waveScaler, 
                  100
                ),
                preserveAspectRatio: 'none',
                innerHtml: WaveHook(recording.context, clip.src())
              }),
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

function handleTimelineKeyEvent (ev) {
  var recording = this.data
  if (ev.keyCode === 83) { // S
    recording.splice(!ev.altKey)
  } else if (ev.keyCode === 32) { // space
    recording.playing.set(!recording.playing())
    recording.ensureCursorVisible(true)
  } else if (ev.keyCode === 39) { // right arrow
    recording.nextCue()
  } else if (ev.keyCode === 37) { // left arrow
    recording.prevCue()
  }
}

function handleClipKeyEvent (ev) {
  var clip = this.data
  var collection = clip.context.collection

  if (ev.keyCode === 8) { // backspace
    clip.context.collection.remove(clip)
  } else if (ev.keyCode === 68) { // D
    // duplicate clip
    var index = collection.indexOf(clip)
    collection.insert(clip(), index + 1)
  } else {
    ev.startPropagation()
  }
}

function handleZoom(delta, recording) {
  var value = Math.round(Math.max(1, Math.min(300, recording.scale() - (delta))))
  recording.scale.set(value)
  recording.centerOnCursor()
}

function handleTrimEnd(ev) {
  var clip = this.data
  var markers = ev.altKey ? null : clip.cuePoints()
  var widthMultiplier = clip.context.recording.scale()
  if (ev.type === 'mousedown'){
    this.lastOffset = 0
    this.startValue = clip.duration.resolved()
    this.start = ev
  } else if (this.start) {
    var offset = (ev.x - this.start.x) / widthMultiplier
    if (this.lastOffset !== offset){
      var newValue = getClosestPoint(markers, clip.startOffset() + this.startValue + offset) - clip.startOffset()
      var duration = Math.min(Math.max(0, newValue), clip.duration.max())
      clip.duration.set(duration)
      this.lastOffset = offset
    }
  }
}

function handleTrimStart(ev) {
  var clip = this.data
  var markers = ev.altKey ? null : clip.cuePoints()
  var widthMultiplier = clip.context.recording.scale()
  if (ev.type === 'mousedown'){
    this.lastOffset = 0
    this.duration = clip.duration.resolved()
    this.startOffset = clip.startOffset()
    this.start = ev
  } else if (this.start) {
    var offset = ev.offsetX / widthMultiplier
    if (this.lastOffset !== offset){
      var newValue = getClosestPoint(markers, this.startOffset + offset)
      var startOffset = Math.min(Math.max(0, newValue), clip.startOffset.max())
      clip.startOffset.set(startOffset)
      clip.duration.set(this.duration + (this.startOffset - startOffset))
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

function goToBeginning (recording) {
  recording.position.set(0)
  recording.centerOnCursor(true)
}

function viewBox (x, y, width, height) {
  return x + ' ' + y + ' ' + width + ' ' + height
}

function toCssAlpha(rgb, alpha) {
  return 'rgba(' + rgb.join(',') + ',' + alpha + ')'
}

function formatTime (value) {
  var minutes = Math.floor(value / 60)
  var seconds = Math.round(value % 60)
  return minutes + ':' + ('0'+seconds).slice(-2)
}

function getPaddedHours (value) {
  return padded(Math.floor(value / 60 / 60) % 60)
}

function getPaddedMinutes (value) {
  return padded(Math.floor(value / 60) % 60)
}

function getPaddedSeconds (value) {
  return padded(Math.floor(value) % 60)
}

function getPaddedFraction (value) {
  return padded((value % 1) * 100)
}

function padded(val) {
  return ('0'+Math.round(val)).slice(-2)
}