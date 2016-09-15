module.exports = Connector

function Connector () {
  if (!(this instanceof Connector)) return new Connector()
  this.connections = []
  this.connected = false
}

Connector.prototype.add = function (a, b) {
  this.connections.push([a, b])
}

Connector.prototype.clear = function () {
  this.connections.forEach(function (x) {
    if (x[2]) {
      x[2] = false
      x[0].disconnect(x[1])
    }
  })
  this.connections.length = 0
}

Connector.prototype.connect = function () {
  this.connected = true
  this.connections.forEach(function (x) {
    if (!x[2]) {
      x[2] = true
      x[0].connect(x[1])
    }
  })
}

Connector.prototype.disconnect = function () {
  this.connected = false
  this.connections.forEach(function (x) {
    if (x[2]) {
      x[2] = false
      x[0].disconnect(x[1])
    }
  })
}
