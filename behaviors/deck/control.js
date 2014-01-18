module.exports = function(container){
  var thisDeckId = getDeckElement(container).dataset.id
  var quantizeValue = false

  window.events.on('changeAutoQuantize', function(deckId, value){
    if (thisDeckId === deckId){
      quantizeValue = value
      if (value){
        container.classList.add('-quantizeActive')
      } else {
        container.classList.remove('-quantizeActive')
      }
    }
  })

  window.events.on('startSampling', function(deckId){
    if (thisDeckId === deckId){
      container.classList.add('-sampling')
    }
  })

  window.events.on('stopSampling', function(deckId){
    if (thisDeckId === deckId){
      container.classList.remove('-sampling')
    }
  })

  container.addEventListener('mousedown', function(e){
    var element = getLink(e.target)
    if (element){
      if (element.classList.contains('.sample')){
        window.events.emit('startSampling', thisDeckId)
      } else if (element.classList.contains('.stopSampling')){
        window.events.emit('stopSampling', thisDeckId)
      } else if (element.classList.contains('.quantize')){
        window.events.emit('changeAutoQuantize', thisDeckId, !quantizeValue)
      }
    }
  })
}

function getLink(node){
  while (node && !node.nodeName === 'A'){
    node = node.parentNode
  }
  return node
}

function getDeckElement(node){
  while (node && !node.classList.contains('Deck')){
    node = node.parentNode
  }
  return node
}