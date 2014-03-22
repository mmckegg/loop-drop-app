var QwertyKeys = require('midi-qwerty-keys')
var handleKey = require('../../lib/handle-key')

module.exports = function(element){
  var currentDeckId = 'left'
  var downNoteInstances = {}
  var repeating = true
  var repeatLength = 1
  var releaseRepeat = null
  var downNotes = []

  var qwertyInput = QwertyKeys({mode: 'grid'})

  window.events.on('selectSlot', function(deckId){
    currentDeckId = deckId
    refreshRepeat()
  })

  function refreshRepeat(){
    releaseRepeat&&releaseRepeat()
    if (repeating && downNotes.length){
      var deckInstance = window.context.instances[currentDeckId]
      releaseRepeat = deckInstance.looper.transform('repeat', downNotes, repeatLength)
    }
  }

  handleKey('`', function(){
    repeating = false
    refreshRepeat()
  })

  handleKey("'", function(){
    var deckInstance = window.context.instances[currentDeckId]
    var length = deckInstance.looper.getLength() * 2
    deckInstance.looper.setLength(length)
  })

  handleKey(';', function(){
    var deckInstance = window.context.instances[currentDeckId]
    var length = deckInstance.looper.getLength() / 2
    deckInstance.looper.setLength(length)
  })

  handleKey('space', function(e){
    if (e.shiftKey){
      currentDeckId = currentDeckId === 'left' ? 'right' : 'left'
      refreshRepeat()
    }
  })

  handleKey('enter', function(){
    var deckInstance = window.context.instances[currentDeckId]
    deckInstance.looper.store()
  })

  handleKey('backspace', function(){
    var deckInstance = window.context.instances[currentDeckId]
    deckInstance.looper.undo()
  })

  var repeatStates = [2, 1, 2/3, 1/2, 1/3, 1/4, 1/6, 1/8]

  handleKey('12345678'.split(''), function(e){
    repeating = true
    repeatLength = repeatStates[e.index]
    refreshRepeat()
  })

  qwertyInput.on('data', function(data){
    var key = data[0] + '/' + data[1]
    if (data[2]){
      downNotes.push(data)
      downNoteInstances[key] = currentDeckId

      if (repeating){
        refreshRepeat()
      } else {
        var deckInstance = window.context.instances[currentDeckId]
        deckInstance.playback.write(data)
      }

    } else { 

      downNotes = downNotes.filter(function(note){
        return !(note[0] == data[0] && note[1] == data[1])
      })

      if (repeating){
        refreshRepeat()
      } else {
        // make sure up note goes to correct instance
        var deckInstance = window.context.instances[downNoteInstances[key]]
        deckInstance.playback.write(data)
      }

    }
  })

}