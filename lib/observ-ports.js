function ObservPorts (context, filters) {
  var portChoices = computed([context.midiPorts], function (midiPorts) {
    return ports.filter(matchPort, ports)
  })
  return portChoices
}

function matchPort (name) {
  for (var i=0;i<this.length;i++) {
    if (this[i].exec(name)) {
      return true
    }
  }
}