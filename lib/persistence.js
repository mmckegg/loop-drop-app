var loadSound = require('./load_sound')

module.exports = {

  load: function(kit, name){
    var audioContext = kit.soundbank.context

    if (window.localStorage['kit/' + name]){
      kit.clear()
      var kitStorage = JSON.parse(window.localStorage['kit/' + name])
      kitStorage.sounds.forEach(function(sound, i){
        if (sound.id != null && sound.url){
          loadSound(sound.url, audioContext, function(err, buffer){
            sound.buffer = buffer
            kit.soundbank.addSound(sound.id, sound)
          })
        }
      })
    }
  },

  store: function(kit, name){
    var audioContext = kit.soundbank.context

    var kitStorage = {
      sounds: kit.soundbank.getSounds().map(function(sound){
        return {
          id: sound.id,
          url: sound.url,
          transpose: sound.transpose,
          gain: sound.gain,
          offsetStart: sound.offsetStart,
          offsetEnd: sound.offsetEnd,
          mode: sound.mode,
          attack: sound.attack,
          release: sound.release,
          busId: sound.busId,
          chokeGroup: sound.chokeGroup
        }
      })
    }
    window.localStorage['kit/' + name] = JSON.stringify(kitStorage)
  },

  save: function(kitHolder){
    kitHolder.kits.forEach(function(kit, i){

      module.exports.store(kit, 'auto' + i)

      var loopStorage = {
        notes: ditty.getNotes(),
        length: ditty.getLength()
      }
      window.localStorage['loop0'] = JSON.stringify(loopStorage)
    })
  },

  restore: function(audioContext, kitHolder){
    kitHolder.kits.forEach(function(kit, i){
      
      module.exports.load(kit, 'auto' + i)

      if (window.localStorage['loop0']){
        var loopStorage = JSON.parse(window.localStorage['loop0'])
        ditty.setNotes(loopStorage.notes, loopStorage.length)
      }
    })
  },

  autoSave: function(kitHolder, interval){
    setInterval(function(){
      module.exports.save(kitHolder)
    }, interval)
  }

}