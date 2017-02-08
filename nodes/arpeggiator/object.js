var ObservStruct = require('@mmckegg/mutant/struct')
var computed = require('@mmckegg/mutant/computed')
var Property = require('lib/property')
var Param = require('lib/param')
var ParamSource = require('lib/param-source')
var applyScale = require('lib/apply-scale')
var ParamTransform = require('lib/param-transform')
var Sum = require('lib/param-sum')

module.exports = ArpeggiatorNode


function ArpeggiatorNode(context) {

  // in the future, get scale from parent and check it's length?
  var position = 0;

  var obs = ObservStruct({
    value: Param(context, 0),
    sequence: Property([0,1,2,3,4,5,6,7])
  })

  var outputParam = ParamSource(context, 0) //
  obs.currentValue = Sum([obs.value, outputParam]) // Multiply([obs.value, outputParam])
  obs.context = context

  //at is the time to trigger the change 
  obs.triggerOn = function(at){
    var sequence = obs.sequence()
    var value = sequence[position++ % sequence.length]
    outputParam.setTargetAtTime(value, at, 0.000001) // value of sound we play, time to start changing to that, time to interpolate to that value
  }

  return obs

}