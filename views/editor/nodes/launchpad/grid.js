var h = require('mercury').h
module.exports = renderGrid
function renderGrid(data, actions){
  if (data){
    var grid = data.grid
    var chunks = data.chunks

    if (grid && chunks){
      var buttons = []
      var length = grid.shape[0] * grid.shape[1]
      for (var r=0;r<grid.shape[0];r++){
        for (var c=0;c<grid.shape[1];c++){
          var classes = '.button'
          var buttonState = grid.get(r,c)
          if (buttonState){
            classes += ' -present'
            if (buttonState.isPlaying) classes += ' -playing'
            if (buttonState.isRecording) classes += ' -recording'
            if (buttonState.isActive) classes += ' -active'
            if (buttonState.noRepeat) classes += ' -noRepeat'
          }

          buttons.push(h('div', {className: classes}))
        }
      }

      return h('div', {className: '.grid'}, [
        buttons,
        chunks.map(function(chunk){
          return renderChunkBlock(chunk, grid.shape, grid.stride)
        })
      ])
    }
  }
}

function renderChunkBlock(chunk, shape, stride){
  var box = {
    top: chunk.origin[0] / shape[0],
    bottom: (chunk.origin[0] + chunk.shape[0]) / shape[0],
    left: chunk.origin[1] / shape[0],
    right: (chunk.origin[1] + chunk.shape[1]) / shape[1]
  }
  var classes = '.chunk'

  if (chunk.isSelected){
    classes += ' -selected'
  }

  var style = 'top:'+percent(box.top)+
              ';height:'+percent(box.bottom - box.top)+
              ';left:'+percent(box.left)+
              ';width:'+percent(box.right - box.left)+
              ';border-color:'+color(chunk.color, 1)+
              ';background-color:'+color(chunk.color, 0.1)+
              ';color:'+color(mixColor(chunk.color, [255,255,255]),1)

  return h('div', { 
    className: classes, 
    style: AttributeHook(style) 
  },[
    h('span', {className: '.label'}, chunk.id)
  ])
}

function percent(decimal){
  return (decimal * 100) + '%'
}

function color(rgb, a){
  if (!Array.isArray(rgb)){
    rgb = [100,100,100]
  }
  return 'rgba(' + rgb[0] +','+rgb[1]+','+rgb[2]+','+a+')'
}

function mixColor(a, b){
  if (!Array.isArray(a)){
    return b
  }
  return [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
    (a[2] + b[2]) / 2
  ]
}

function AttributeHook(value) {
  if (!(this instanceof AttributeHook)) {
    return new AttributeHook(value);
  }
  this.value = value;
}

AttributeHook.prototype.hook = function (node, prop, prev) {
  if (prev && prev.value === this.value) {
    return;
  }
  node.setAttributeNS(null, prop, this.value)
}