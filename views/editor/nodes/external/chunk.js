var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

module.exports = function(node, setup){
  var data = node()
  var innerData = node.resolved() || {}

  if (data){

    var selected = setup.selectedChunkId() == data.id
    var style = 'background-color:'+color(innerData.color, selected ? 0.5 : 0.1) +
                ';border: 2px solid '+color(innerData.color, selected ? 1 : 0)
    return h('div ExternalNode', [
      h('header', {
        style: AttributeHook(style)
      }, innerData.id + ' (' + innerData.node + ')')
    ])
  }
  return h('UnknownNode')
}

function color(rgb, a){
  if (!Array.isArray(rgb)){
    rgb = [100,100,100]
  }
  return 'rgba(' + rgb[0] +','+rgb[1]+','+rgb[2]+','+a+')'
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