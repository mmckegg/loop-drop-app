var ApplyParam = require('lib/apply-param')
module.exports = Connector

function Connector (audioContext) {
  if (!(this instanceof Connector)) return new Connector(audioContext)
  this.connections = []
  this.params = []
  this.connected = false
  this.context = audioContext
}

Connector.prototype.add = function (a, b) {
  var connection = [a, b]
  this.connections.push(connection)
  if (this.connected) {
    connection[2] = true
    connection[0].connect(connection[1])
  }
}

Connector.prototype.addParam = function (a, b) {
  var connection = [a, b]
  this.params.push(connection)
  if (this.connected) {
    connection[2] = ApplyParam(this.context, connection[1], connection[0])
  }
}

Connector.prototype.clear = function () {
  disconnect(this)
  this.params.length = 0
  this.connections.length = 0
}

Connector.prototype.connect = function () {
  this.connected = true
  this.connections.forEach((x) => {
    if (!x[2]) {
      x[2] = true
      x[0].connect(x[1])
    }
  })
  this.params.forEach((x) => {
    if (!x[2]) {
      x[2] = ApplyParam(this.context, x[1], x[0])
    }
  })
}

Connector.prototype.disconnect = function () {
  this.connected = false
  disconnect(this)
}

function disconnect (instance) {
  instance.connections.forEach((x) => {
    if (x[2]) {
      x[2] = false
      x[0].disconnect(x[1])
    }
  })
  instance.params.forEach((x) => {
    if (x[2]) {
      x[2]()
      x[2] = null
    }
  })
}
