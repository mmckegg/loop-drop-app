var ObservStruct = require('observ-struct')
var Observ = require('observ')

module.exports = ObservStruct({
  projectDirectory: Observ()
})

module.exports.set(JSON.parse(window.localStorage.state||'{}'))

module.exports(function(value) {
  window.localStorage.state = JSON.stringify(value)
})