var Dict = require('mutant/dict')
module.exports = MultiChannelOutput

function MultiChannelOutput (destination) {
  var obs = Dict({})
  var connections = []
  var audioContext = destination.context
  var releases = [
    obs(routes => {
      var inputCount = Object.keys(routes).length
      var channelCount = Object.keys(routes).reduce(maxChannel, 0)

      destination.channelCount = channelCount
      destination.channelInterpretation = 'discrete'

      disconnectAll()

      if (inputCount === 1 && channelCount === 2) {
        // fast route
        Object.keys(routes).forEach(key => {
          connect(routes[key], destination)
        })
      } else {
        let merger = audioContext.createChannelMerger(channelCount)

        Object.keys(routes).forEach(key => {
          var input = routes[key]
          var channels = getChannelsFromKey(key)
          var splitter = audioContext.createChannelSplitter(input.channelCount)
          connect(input, splitter)
          channels.forEach((channel, i) => {
            splitter.connect(merger, i, channel - 1)
          })
        })

        connect(merger, destination)
      }
    })
  ]

  obs.destroy = function () {
    disconnectAll()
    while (releases.length) {
      releases.pop()()
    }
  }

  return obs

  function connect (from, to) {
    connections.push([from, to])
    from.connect(to)
  }

  function disconnectAll () {
    while (connections.length) {
      var connection = connections.pop()
      connection[0].disconnect(connection[1])
    }
  }
}

function maxChannel (lastResult, key) {
  getChannelsFromKey(key).forEach(value => {
    if (value > lastResult) {
      lastResult = value
    }
  })
  return lastResult
}

function getChannelsFromKey (key) {
  return key.split(',').map(str => parseInt(str.trim(), 10))
}
