var QwertyKeys = require('midi-qwerty-keys')
var handleKey = require('../../lib/handle-key')

module.exports = function(element){
  var currentDeckId = 'left'
  var upEvents = {}
  var repeating = false
  var repeatLength = 1
  var releaseRepeat = null
  var active = []

  var qwertyInput = QwertyKeys({mode: 'grid'})

  window.events.on('selectSlot', function(deckId){
    currentDeckId = deckId
    refreshRepeat()
  })

  function refreshRepeat(){
    releaseRepeat&&releaseRepeat()
    if (repeating && active.length){
      var deckInstance = window.context.instances[currentDeckId]
      releaseRepeat = deckInstance.transform(repeat, active, repeatLength)
    }
  }

  handleKey('`', function(){
    repeating = false
    refreshRepeat()
  })

  handleKey("'", function(){
    var deckInstance = window.context.instances[currentDeckId]
    var length = deckInstance.loopLength() * 2
    deckInstance.loopLength.set(length)
  })

  handleKey(';', function(){
    var deckInstance = window.context.instances[currentDeckId]
    var length = deckInstance.loopLength() / 2
    deckInstance.loopLength.set(length)
  })

  handleKey('space', function(e){
    if (e.shiftKey){
      currentDeckId = currentDeckId === 'left' ? 'right' : 'left'
      refreshRepeat()
    }
  })

  handleKey('enter', function(){
    var deckInstance = window.context.instances[currentDeckId]
    var start = window.context.clock.getCurrentPosition() - deckInstance.loopLength()
    deckInstance.loopRange(start, deckInstance.loopLength())
  })

  handleKey('backspace', function(){
    var deckInstance = window.context.instances[currentDeckId]
    deckInstance.undo()
  })

  var repeatStates = [2, 1, 2/3, 1/2, 1/3, 1/4, 1/6, 1/8]

  handleKey('12345678'.split(''), function(e){
    repeating = true
    repeatLength = repeatStates[e.index]
    refreshRepeat()
  })

  var releaseHold = null
  handleKey('0', function(){
    if (!releaseHold){
      var deckInstance = window.context.instances[currentDeckId]
      var start = window.context.clock.getCurrentPosition()
      releaseHold = deckInstance.transform(hold, start, repeatLength)
    }
  }, function(){
    releaseHold()
    releaseHold = null
  })

  qwertyInput.on('data', function(data){
    var key = data[0] + '/' + data[1]
    var deckInstance = window.context.instances[currentDeckId]
    var id = deckInstance.grid().data[data[1]]

    if (data[2]){
      active.push(data[1])
      upEvents[key] = {
        event: 'stop',
        id: id
      }

      if (repeating){
        refreshRepeat()
      } else {
        var obj = {
          event: 'start',
          id: id,
          position: window.context.clock.getCurrentPosition()
        }
        window.context.triggerOutput.write(obj)
      }

    } else { 

      active = active.filter(function(note){
        return note !== data[1]
      })

      if (repeating){
        refreshRepeat()
      } else {
        var up = upEvents[key]
        if (up){
          up.position = window.context.clock.getCurrentPosition()
          window.context.triggerOutput.write(up)
        }
      }

    }
  })

}

function repeat(input, active, length){
  active.forEach(function(index){
    input.data[index] = {
      events: [[0, length/2]],
      length: length
    }
  })
  return input
}

function hold(input, start, length, indexes){
  var end = start + length
  input.data.forEach(function(loop, i){
    if (loop && (!indexes || !indexes.length || ~indexes.indexOf(i))){
      var from = start % loop.length
      var to = end % loop.length
      var events = []

      loop.events.forEach(function(event){
        if (inRange(from, to, event[0])){
          event = event.concat()
          event[0] = event[0] % length
          event[1] = Math.min(event[1], length)
          events.push(event)
        }
      })

      input.data[i] = {
        events: events,
        length: length
      }
    }
  })
  return input
}

function inRange(from, to, value){
  if (to > from){
    return value >= from && value < to
  } else {
    return value >= from || value < to
  }
}