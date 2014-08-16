module.exports = function(container){
  var deckElement = getDeckElement(container)
  var thisDeckId = deckElement.dataset.id
  var loopGrid = window.context.instances[thisDeckId]
  var lastBeat = -1

  var bar = container.querySelector('div')

  var progress = 0
  var stepWidth = 1/8

  function refresh(){
    bar.style.webkitTransform = 'scale(' + stepWidth + ', 1)'
    bar.style.webkitTransformOrigin = (progress*100) + '%'
  }

  loopGrid.loopPosition(function(value){
    var step = 1
    var beat = Math.floor(value / step) * step
    if (lastBeat != beat){
      progress = beat / (loopGrid.loopLength() - 1)
      stepWidth = (step/length)
      window.requestAnimationFrame(refresh)
    }
  })
}

function getDeckElement(node){
  while (node && !node.classList.contains('Deck')){
    node = node.parentNode
  }
  return node
}