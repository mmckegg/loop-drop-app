var WaveView = require('wave-view')

module.exports = function(element){
  var waveView = WaveView()
  var lastUrl = null
  var offset = [0,1]
  var path = null
  var nodeElement = getNodeElement(element)
  var gain = 1
  var lastGain = 1

  waveView.dataset.preserve = true

  var startSlider = createSlider({
    className: '.start -noRefresh'
  })

  var endSlider = createSlider({
    className: '.end -noRefresh'
  })


  function refresh(){

    path = nodeElement.dataset['path']
    offset = [
      floatOrDefault(element.dataset['in'], 0),
      floatOrDefault(element.dataset['out'], 1)
    ]
    gain = floatOrDefault(element.dataset['gain'], 1)

    if (gain !== lastGain){
      waveView.setGain(gain)
      lastGain = gain
    }

    if (lastUrl !== element.dataset['url']){
      lastUrl = element.dataset['url']
      window.context.audio.loadSample(lastUrl, function(buffer){
        waveView.setValue(buffer)
      })
    }



    waveView.setOffset(offset)
    startSlider.value = offset[0]
    endSlider.value = offset[1]
  }

  element.appendChild(waveView)
  element.appendChild(startSlider)
  element.appendChild(endSlider)

  startSlider.onchange = function(){
    offset[0] = parseFloat(this.value)
    element.dataset['in'] = this.value
    waveView.setOffset(offset)
    window.events.emit('updateActiveSlot', path + '.offset', offset)
  }

  endSlider.onchange = function(){
    offset[1] = parseFloat(this.value)
    element.dataset['out'] = this.value
    waveView.setOffset(offset)
    window.events.emit('updateActiveSlot', path + '.offset', offset)
  }

  refresh()

  return refresh
}

function createSlider(options){
  var slider = document.createElement('input')
  slider.dataset.preserve = true
  slider.className = options.className
  slider.type = 'range'
  slider.min = 0
  slider.max = 1
  slider.step = 0.00125
  return slider
}

function getNodeElement(node){
  while (node && !node.classList.contains('Node')){
    node = node.parentNode
    if (node === document) { 
      node = null 
    }
  }
  return node
}

function floatOrDefault(text, defaultValue){
  var value = parseFloat(text)
  if (isNaN(value)){
    return defaultValue
  } else {
    return value
  }
}