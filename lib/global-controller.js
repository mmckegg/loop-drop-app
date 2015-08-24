var MidiStream = require('midi-stream')
var extend = require('xtend')

var portMatch = [
  [/$Launch Control/, 'global-controller/launch-control']
]

var portChoices = Observ([])
MidiStream.watchPortNames(function (ports) {
  obs.portChoices.set(ports.filter(matchPort))
})


function GlobalController (context) {
  var obs = Node(context)
  obs.portChoices = portChoices

  var lastPortName = null
  obs(function (data) {
    if (data && data.port !== lastPortName) {
      lastPortName = data.port
      var nodeName = matchPort(data.port)
      if (nodeName) {
        obs.set(extend(data, {
          node: nodeName
        }))
      }
    }
  })

  return obs
}

function matchPort (name) {
  for (var i=0;i<portMatch.length;i++) {
    if (portMatch[i][0].exec(name)) {
      return portMatch[i][1]
    }
  }
}