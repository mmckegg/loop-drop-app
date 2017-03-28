var Processor = require('lib/processor')
var Param = require('lib/param')
var Apply = require('lib/apply-param')
var Multiply = require('lib/param-multiply')
var ParamClamp = require('lib/param-clamp')

module.exports = SpatialPanNode

function SpatialPanNode (context) {
  var delayL = context.audio.createDelay(0.04)
  var delayR = context.audio.createDelay(0.04)
  var splitter = context.audio.createChannelSplitter(2)
  var merger = context.audio.createChannelMerger(2)
  var panner = context.audio.createStereoPanner()

  splitter.channelCount = 2
  splitter.channelCountMode = 'explicit'

  splitter.connect(delayL, 0)
  splitter.connect(delayR, 1)
  delayL.connect(merger, 0, 0)
  delayR.connect(merger, 0, 1)
  merger.connect(panner)

  var releases = []

  var obs = Processor(context, splitter, panner, {
    offset: Param(context, 0.1)
  }, releases)

  releases.push(
    Apply(context.audio, delayL.delayTime, Multiply([
      ParamClamp(obs.offset, 0, 1), 0.003
    ])),
    Apply(context.audio, delayR.delayTime, Multiply([
      ParamClamp(obs.offset, -1, 0), -0.003
    ])),
    Apply(context.audio, panner.pan, Multiply([
      obs.offset, 0.5
    ]))
  )
  return obs
}
