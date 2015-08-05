var watch = require('observ/watch')
var Observ = require('observ')
var ObservStruct = require('observ-struct')
var Event = require('geval')

module.exports = function (context, items) {

  var releases = []

  var obs = Event(function (broadcast) {
    var nextSetupId = 0
    var scheduler = context.scheduler

    var posOffset = Math.floor(scheduler.getCurrentPosition())

    // don't start emitting until end of cycle
    setImmediate(function () {

      releases.push(
        watch(context.tempo, function (value) {
          broadcast([
            scheduler.getCurrentPosition()-posOffset, 'tempo', value
          ])
        }),
        items.onLoad(addFile)
      )

      items.forEach(addFile)
    })

    function addFile(fileObject) {
      if (fileObject.node && fileObject.node._type === 'LoopDropSetup') {
        var id = nextSetupId++
        var setup = fileObject.node

        var release = setup.onTrigger(function (data) {
          broadcast([data.position-posOffset, 'trigger', id, data.id, data.event, data.args])
        })

        releases.push(release)

        broadcast([
          scheduler.getCurrentPosition()-4-posOffset, 'loadSetup', fileObject.path, id
        ])

        fileObject.onClose(function () {
          broadcast([
            scheduler.getCurrentPosition()-4-posOffset, 'closeSetup', id
          ])

          releases.splice(releases.indexOf(release), 1)
          release()
        })
      }
    }

  })

  obs.destroy = function () {
    while (releases.length) {
      releases.pop()()
    }
  }

  return obs
}