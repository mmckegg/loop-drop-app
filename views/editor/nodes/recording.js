var h = require('micro-css/h')(require('virtual-dom/h'))
var svg = require('micro-css/h')(require('virtual-dom/virtual-hyperscript/svg'))
var objectifyRecording = require('lib/objectify-recording')
var randomColor = require('lib/random-color')
var ObservValueHook = require('lib/observ-value-hook')
var ObservClassHook = require('lib/observ-class-hook')
var ObservStyleHook = require('lib/observ-style-hook')
var send = require('value-event/event')
var getTimeFromPosition = require('lib/time-from-position')

module.exports = RecordingView

function RecordingView (recording) {
  return h('RecordingNode', [
    
    h('div.main', [
      ArrangementTimeline(recording)
    ]),
    
    h('div.options', [
      h('section', [
        h('button ToggleButton -main', {
          'ev-class': ObservClassHook(recording.playing, '-active', true),
        }, 'Play')
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
  var data = objectifyRecording(recording.events())
  var widthMultiplier = 5
  var finalWidth = data.end * widthMultiplier

  return h('ArrangementTimeline', [
    h('div.content', {
      style: {
        width: finalWidth + 'px'
      }
    }, [
      renderSvgTimeline(data.end, widthMultiplier, recording.timeMapping),
      h('input', {
        type: 'range', 
        min: 0, 
        max: data.end, 
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
      data.setups.map(function (setup) {
        var setupStart = Math.max(0, setup.start)
        var setupX = widthMultiplier * (setupStart)
        var setupW = widthMultiplier * (setup.end - setupStart)
        return h('div.group', {
          style: {
            left: setupX + 'px',
            width: setupW + 'px'
          }
        }, [
          h('header', [
            setup.name
          ]),
          Object.keys(setup.chunks).map(function (id) {
            var color = randomColor()

            var slots = setup.chunks[id]
            return h('div.track', [
              h('div.clip', {
                style: { 
                  backgroundColor: toCssAlpha(color, 0.3), 
                  borderColor: toCssAlpha(color, 0.1) 
                }
              }, [
                h('header', id),
                ClipSVG(setupStart, widthMultiplier, setupW, slots)
              ])
            ])
          })
        ])
      })
    ])
  ])
}

function renderSvgTimeline (length, widthMultiplier, mapping) {
  var elements = []
  var xOffset = 6

  for (var i=0;i<length;i+=1) {
    var x = i * widthMultiplier + xOffset
    elements.push(svg('line', {
      x1: x, x2: x, y1: 0, y2: i % 8 ? 3 : 12,
      stroke: 'rgba(255,255,255,0.5)'
    }))

    if (i % 8 === 0) {
      var val = formatTime(getTimeFromPosition(i, mapping))
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

function ClipSVG (positionOffset, widthMultiplier, width, slots) {
  var yOffset = 0
  var xOffset = positionOffset * widthMultiplier
  var events = slots.map(function (slot) {
    yOffset += 1
    return slot.map(function (event) {
      return svg('line', {
        x1: event[0] * widthMultiplier - xOffset,
        x2: (event[0] + event[1]) * widthMultiplier - xOffset,
        y1: yOffset, 
        y2: yOffset,
        stroke: 'rgba(255,255,255,0.5)'
      })
    })
  })

  return svg('svg', {
    width: width,
    preserveAspectRatio: 'none',
    viewBox: '0 0 ' + width + ' ' + yOffset,
    height: 30
  }, events)
}

function toCssAlpha(rgb, alpha) {
  return 'rgba(' + rgb.join(',') + ',' + alpha + ')'
}

function formatTime (value) {
  var minutes = Math.floor(value / 60)
  var seconds = Math.round(value % 60)
  return minutes + ':' + ('0'+seconds).slice(-2)
}