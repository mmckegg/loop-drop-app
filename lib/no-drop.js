module.exports = function(el){
  el.addEventListener('dragover', function(e){
    e.preventDefault()
    e.dataTransfer.dropEffect = 'none'
  }, true)
}