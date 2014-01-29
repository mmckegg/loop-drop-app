module.exports = function(container){
  var deckElement = getDeckElement(container)
  var thisDeckId = deckElement.dataset.id
  var looper = window.context.instances[thisDeckId].looper
  var clock = window.context.clock
  var position = 0

  var bar = container.querySelector('div')

  var progress = 0
  var stepWidth = 1/8

  function refresh(){
    bar.style.webkitTransform = 'scale(' + stepWidth + ', 1)'
    bar.style.webkitTransformOrigin = (progress*100) + '%'
  }

  clock.on('data', function(schedule){
    position = schedule.from

    var length = looper.getLength()

    var step = 1
    var currentBeat = Math.floor(schedule.to / step) * step

    if (currentBeat > schedule.from && currentBeat <= schedule.to){
      progress = (currentBeat % length) / (length - 1)
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