module.exports = getPortSiblings

function getPortSiblings (obs, controllers) {
  var index = null
  var matches = []
  controllers.forEach(function (c, i) {
    if (c.port && c.port() === obs.port()) {
      if (c === obs) {
        index = i
      }
      matches.push(i)
    }
  })
  return [
    controllers.get(matches[mod(index - 1, matches.length)]),
    controllers.get(matches[mod(index + 1, matches.length)])
  ]
}


function mod (n, m) {
  return ((n % m) + m) % m
}
