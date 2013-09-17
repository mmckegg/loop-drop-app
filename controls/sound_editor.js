var Knob = require('knob')
var WaveView = require('wave-view')
var Slider = require('./slider')
var ModeSelector = require('./mode_selector')
var ActionSelector = require('./action_selector')
var BusSelector = require('./bus_selector')

var actions = require('../lib/actions')

var h = require('hyperscript')

module.exports = function(){

  var waveView = WaveView({className: 'WaveView'})

  var currentlyEditing = null
  var soundbank = null

  var transposeKnob = Knob({
    value: 0,
    label: 'transpose',
    cursor: 20,
    angleOffset: -125,
    angleArc: 250,
    min: -24,
    max: 24,
    fgColor: '#FFF',
    bgColor: '#222',
    labelColor: '#EEE',
    width: 130,
    className: 'transpose',
    activeClass: '-active'
  })

  var gainKnob = Knob({
    value: 100,
    label: 'gain',
    angleOffset: -125,
    angleArc: 250, 
    min: 0, 
    max: 300,
    fgColor: '#FFF',
    bgColor: '#222',
    labelColor: '#EEE',
    width: 130,
    className: 'gain',
    activeClass: '-active'
  })

  var modeSelector = ModeSelector({
    className: 'mode'
  })

  var actionSelector = ActionSelector({
    className: 'action'
  })

  var startSlider = Slider({
    className: 'startOffset',
    value: 0,
    min: 0, max: 1,
    step: 0.00125
  })
  var endSlider = Slider({
    value: 1,
    className: 'endOffset',
    min: 0, max: 1,
    step: 0.00125
  })

  var busSelector = BusSelector({
    className: 'bus'
  })


  startSlider.onchange = function(){
    if (currentlyEditing){
      currentlyEditing.offsetStart = currentlyEditing.buffer.duration * this.value
      waveView.refresh()
      soundbank.refresh(currentlyEditing.id)
    }
  }
  endSlider.onchange = function(){
    if (currentlyEditing){
      currentlyEditing.offsetEnd = currentlyEditing.buffer.duration * (1 - this.value)
      waveView.refresh()
      soundbank.refresh(currentlyEditing.id)
    }
  }
  transposeKnob.onchange = function(){
    if (currentlyEditing){
      currentlyEditing.transpose = this.getValue()
      soundbank.refresh(currentlyEditing.id)
    }
  }
  gainKnob.onchange = function(){
    if (currentlyEditing){
      currentlyEditing.gain = gainFromKnobValue(this.getValue())
      waveView.refresh()
      soundbank.refresh(currentlyEditing.id)
    }
  }
  modeSelector.onchange = function(){
    if (currentlyEditing){
      currentlyEditing.mode = this.value
      soundbank.refresh(currentlyEditing.id)
    }
  }



  actionSelector.on('action', function(action){
    if (actions[action] && currentlyEditing){
      actions[action](currentlyEditing)
      soundEditor.edit(currentlyEditing)
    }
  })

  var soundEditor = h('div.SoundEditor', waveView,
    h('div.Controls', 
      transposeKnob, 
      gainKnob, 
      modeSelector, 
      actionSelector, 
      startSlider, 
      endSlider,
      busSelector      
    )
  )

  soundEditor.edit = function(sound){
    console.log('EDIT:', sound)
    currentlyEditing = null
    if (sound && sound.buffer){
      waveView.setValue(sound)
      startSlider.value = (sound.offsetStart || 0) / sound.buffer.duration
      endSlider.value = 1 - ((sound.offsetEnd || 0) / sound.buffer.duration)
      transposeKnob.setValue(sound.transpose || 0)
      gainKnob.setValue(gainToKnobValue(sound.gain || 1))
      modeSelector.value = sound.mode || 'oneshot'
      currentlyEditing = sound
      soundbank = sound.soundbank
      busSelector.setTarget(sound)
    } else {

      currentlyEditing = null
      startSlider.value = 0
      endSlider.value = 1
      transposeKnob.setValue(0)
      gainKnob.setValue(100)
      modeSelector.value = 'oneshot'
      busSelector.setTarget(null)
      waveView.clear()
    }

  }

  return soundEditor
}

var scaleFactor = 10

function gainToKnobValue(gain){
  if (gain > 1){
    return (1 + ((gain - 1) / scaleFactor)) * 100
  } else {
    return gain * 100
  }
}

function gainFromKnobValue(value){
  if (value > 100){
    return 1 + (((value / 100) - 1) * scaleFactor)
  } else {
    return value / 100
  }
}
