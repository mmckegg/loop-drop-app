module.exports = function(container){

  window.events.on('setEditorView', function(view){
    for (var i=0;i<container.children.length;i++){
      var element = container.children[i]
      if (element.dataset.value === view){
        element.classList.add('-selected')
      } else {
        element.classList.remove('-selected')
      }
    }
  })

  container.addEventListener('click', function(e){
    var element = getLink(e.target)
    if (element && element.dataset.value){
      window.events.emit('setEditorView', element.dataset.value)
    }
  })
}

function getLink(node){
  while (node && !node.nodeName === 'A'){
    node = node.parentNode
  }
  return node
}