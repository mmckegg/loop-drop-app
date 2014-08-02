// compat for old midi-looper to new ditty
module.exports = function UpdateLoop(ditty){
  var currentlyActive = {}

  return {
    writable: true,
    readable: false,
    on: function(){},
    emit: function(){},
    write: function(playback){
      var loops = {}
      for (var i=0;i<playback.notes.length;i++){
        var note = playback.notes[i]
        var loop = loops[note[1]] = loops[note[1]] || []
        loop.push([note[3], note[4], note[2]])
      }

      for (var k in currentlyActive){
        if (currentlyActive[k] === true && !loops[k]){
          ditty.set(k, null)
          ;delete currentlyActive[k]
        }
      }

      for (var k in loops){
        if (k in loops){
          ditty.set(k, loops[k], playback.length)
          currentlyActive[k] = true
        }
      }

    }
  }
}