module.exports = {
  'transdist-up-7': function(sound){
    var soundbank = sound.soundbank
    checkAddChoke(sound)   

    for (var i=1;i<8;i++){
      var newSound = mergeClone(sound, {
        transpose: (sound.transpose || 0) + i
      })
      soundbank.addSound(parseInt(sound.id) + i, newSound)
    }
  },
  'transdist-down-8': function(sound){
    var soundbank = sound.soundbank
    checkAddChoke(sound)

    for (var i=-9;i<0;i++){
      var newSound = mergeClone(sound, {
        transpose: (sound.transpose || 0) + i
      })
      soundbank.addSound(parseInt(sound.id) + i, newSound)
    }
  },
  'slice-8': function(sound){
    slice(sound, 8)
  },
  'slice-16': function(sound){
    slice(sound, 16)
  }
}

function mergeClone(){
  var result = {}
  for (var i=0;i<arguments.length;i++){
    var obj = arguments[i]
    if (obj){
      Object.keys(obj).forEach(function(key){
        result[key] = obj[key]
      })
    }
  }
  return result
}

function slice(sound, parts){
  var soundbank = sound.soundbank
  checkAddChoke(sound)

  var duration = sound.buffer.duration - (sound.offsetStart || 0) - (sound.offsetEnd || 0)
  var sliceLength = duration / parts

  for (var i=0;i<parts;i++){
    var newSound = mergeClone(sound, {
      offsetStart: (sound.offsetStart || 0) + sliceLength * i,
      offsetEnd: (sound.offsetEnd || 0) + (parts - i - 1) * sliceLength
    })
    soundbank.addSound(parseInt(sound.id) + i, newSound)
  }
}

function checkAddChoke(sound){
  if (sound.mode == 'oneshot' || !sound.mode){
    sound.chokeGroup = Date.now()
  }
}