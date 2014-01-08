module.exports = function(element){
  window.events.on('selectSlot', function(deckId){
    if (deckId === element.dataset.id){
      element.classList.add('-selected')
    } else {
      element.classList.remove('-selected')
    }
  })
}
