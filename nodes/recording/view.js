var h = require('lib/h')
var svg = require('lib/svg')
var ev = require('lib/dom-event')
var watchAll = require('@mmckegg/mutant/watch-all')
var send = require('@mmckegg/mutant/send')
var computed = require('@mmckegg/mutant/computed')
var watch = require('@mmckegg/mutant/watch')
var map = require('@mmckegg/mutant/map')
var when = require('@mmckegg/mutant/when')

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
      when(recording.rendering, h('progress', {
        min: 0,
        max: 1,
        hooks: [ValueHook(recording.renderProgress)]
      })),

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
        h('span.hours', [
          computed(recording.position, getPaddedHours)
        ]),
        ':',
        h('span.minutes', [
          computed(recording.position, getPaddedMinutes)
        ]),
        ':',
        h('span.seconds', [
          computed(recording.position, getPaddedSeconds)
        ]),
        '.',
        h('span.fraction', [
          computed(recording.position, getPaddedFraction)
        ])
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
  var widthMultiplier = recording.scale
  var duration = computed([recording.duration, 20], add)
  var finalWidth = computed([duration, widthMultiplier], multiply)
  var cssWidth = computed(finalWidth, px)
  var waveScaler = computed(widthMultiplier, w => (40 / w) * w)

  return h('ArrangementTimeline', {
    'ev-mousewheel': ZoomEvent(handleZoom, recording)
  }, [
    h('div.content', {
      style: {
        width: cssWidth
      }
    }, [
      renderSvgTimeline(duration, widthMultiplier),
      h('input', {
        type: 'range',
        min: 0,
        max: duration,
        style: {
          width: cssWidth
        },
        step: 0.01,
        hooks: [
          ValueHook(recording.position)
        ]
      }),
      h('div.cursor', {
        style: {
          transform: computed([recording.position, recording.scale], function (position, scale) {
            return 'translateX(' + (position) * scale + 'px)'
          })
        }
      }),

      h('div.timeline', {
        style: {
          width: cssWidth
        }
      }, [
        h('div.primary', [
          map(recording.timeline.primary, function (clip) {
            return h('div.clip', {
              tabIndex: 0,
              classList: computed(clip.flags, flagClass),
              'ev-keydown': ev(handleClipKeyEvent, clip), // bcksp
              style: {
                width: computed([clip.duration.resolved, widthMultiplier], (d, w) => d * w + 'px')
              }
            }, [
              computed(clip.src, function (src) {
                return svg('svg', {
                  width: computed([clip.duration.resolved, widthMultiplier], multiply),
                  height: 100,
                  viewBox: computed([clip.startOffset, clip.duration.resolved, waveScaler], getClipViewBox),
                  preserveAspectRatio: 'none',
                  hooks: [
                    WaveHook(recording.context, src)
                  ]
                })
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
  var handled = true
  if (ev.keyCode === 83) { // S
    recording.splice(!ev.altKey)
  } else if (ev.keyCode === 32) { // space
    recording.playing.set(!recording.playing())
    recording.ensureCursorVisible(true)
  } else if (ev.keyCode === 39) { // right arrow
    recording.nextCue()
  } else if (ev.keyCode === 37) { // left arrow
    recording.prevCue()
  } else {
    handled = false
  }

  if (handled) {
    ev.stopPropagation()
  }
}

function handleClipKeyEvent (ev) {
  var clip = this.data
  var collection = clip.context.collection

  if (ev.keyCode === 8) { // backspace
    clip.context.collection.remove(clip)
    ev.stopPropagation()
  } else if (ev.keyCode === 68) { // D
    // duplicate clip
    var index = collection.indexOf(clip)
    collection.insert(clip(), index + 1)
    ev.stopPropagation()
  }
}

function handleZoom (delta, recording) {
  var value = Math.round(Math.max(1, Math.min(300, recording.scale() - (delta))))
  recording.scale.set(value)
  recording.centerOnCursor()
}

function handleTrimEnd (ev) {
  var clip = this.data
  var markers = ev.altKey ? null : clip.cuePoints()
  var widthMultiplier = clip.context.recording.scale()
  if (ev.type === 'mousedown') {
    this.lastOffset = 0
    this.startValue = clip.duration.resolved()
    this.start = ev
  } else if (this.start) {
    var offset = (ev.x - this.start.x) / widthMultiplier
    if (this.lastOffset !== offset) {
      var newValue = getClosestPoint(markers, clip.startOffset() + this.startValue + offset) - clip.startOffset()
      var duration = Math.min(Math.max(0, newValue), clip.duration.max())
      clip.duration.set(duration)
      this.lastOffset = offset
    }
  }
}

function handleTrimStart (ev) {
  var clip = this.data
  var markers = ev.altKey ? null : clip.cuePoints()
  var widthMultiplier = clip.context.recording.scale()
  if (ev.type === 'mousedown') {
    this.lastOffset = 0
    this.duration = clip.duration.resolved()
    this.startOffset = clip.startOffset()
    this.start = ev
  } else if (this.start) {
    var offset = ev.offsetX / widthMultiplier
    if (this.lastOffset !== offset) {
      var newValue = getClosestPoint(markers, this.startOffset + offset)
      var startOffset = Math.min(Math.max(0, newValue), clip.startOffset.max())
      clip.startOffset.set(startOffset)
      clip.duration.set(this.duration + (this.startOffset - startOffset))
      this.lastOffset = offset
    }
  }
}

function renderSvgTimeline (length, widthMultiplier) {
  var xOffset = 6

  var fullWidth = computed([length, widthMultiplier, xOffset], (l, m, x) => l * m + x)

  return svg('svg', {
    width: fullWidth,
    viewBox: computed(fullWidth, w => '0 0 ' + w + ' 16'),
    preserveAspectRatio: 'xMinYMin',
    hooks: [
      TimelineTicksHook(length, widthMultiplier, xOffset)
    ]
  })
}

function TimelineTicksHook (length, widthMultiplier, xOffset) {
  return function (element) {
    var lines = []
    var times = []

    return watchAll([length, widthMultiplier], function (length, widthMultiplier) {
      while (lines.length < length) {
        var i = lines.length
        element.insertAdjacentHTML('beforeend', `<line x1="0" x2="0" y1="0" y2="0" stroke="silver"/>`)
        lines.push(element.childNodes[element.childNodes.length - 1])
        if (i % 5 === 0) {
          var val = formatTime(i)
          element.insertAdjacentHTML('beforeend', `<text x="0" y="5">${val}</text>`)
          times.push(element.childNodes[element.childNodes.length - 1])
        }
      }

      var lastTimeX = 0
      for (var i = 0; i < lines.length; i++) {
        var x = i * widthMultiplier + xOffset
        lines[i].setAttribute('x1', x)
        lines[i].setAttribute('x2', x)
        lines[i].setAttribute('y2', 3)
        if (i % 5 === 0) {
          var time = times[Math.floor(i / 5)]
          time.setAttribute('x', x + 6)
          if (!lastTimeX || x - lastTimeX > 50) {
            time.setAttribute('visibility', 'visible')
            lines[i].setAttribute('y2', 12)
            lastTimeX = x
          } else {
            time.setAttribute('visibility', 'hidden')
          }
        }
      }
    })
  }
}

function goToBeginning (recording) {
  recording.position.set(0)
  recording.centerOnCursor(true)
}

function getClipViewBox (startOffset, duration, waveScaler) {
  var x = startOffset * waveScaler
  var y = 0
  var width = duration * waveScaler
  var height = 100
  return x + ' ' + y + ' ' + width + ' ' + height
}

function formatTime (value) {
  var minutes = Math.floor(value / 60)
  var seconds = Math.round(value % 60)
  return minutes + ':' + ('0' + seconds).slice(-2)
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

function padded (val) {
  return ('0' + Math.round(val)).slice(-2)
}

function flagClass (value) {
  if (Array.isArray(value)) {
    var classes = []
    if (~value.indexOf('preroll')) {
      classes.push('-preroll')
    }
    return classes.join(' ')
  }
}

function ValueHook (obs) {
  return function (element) {
    element.oninput = function handler (ev) {
      obs.set(parseFloat(element.value))
    }

    return watch(obs, function (value) {
      element.value = value
    })
  }
}

function add (a, b) {
  return a + b
}

function multiply (a, b) {
  return a * b
}

function px (value) {
  return value + 'px'
}
