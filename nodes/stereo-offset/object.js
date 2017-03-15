var Processor = require('lib/processor')
var Param = require('lib/param')
var Apply = require('lib/apply-param')
var Multiply = require('lib/param-multiply')
var ParamClamp = require('lib/param-clamp')

module.exports = StereoOffsetNode

function StereoOffsetNode (context) {
  var delayL = context.audio.createDelay(0.04)
  var delayR = context.audio.createDelay(0.04)
  var splitter = context.audio.createChannelSplitter(2)
  var merger = context.audio.createChannelMerger(2)

  splitter.channelCount = 2
  splitter.channelCountMode = 'explicit'

  splitter.connect(delayL, 0)
  splitter.connect(delayR, 1)
  delayL.connect(merger, 0, 0)
  delayR.connect(merger, 0, 1)

  var releases = []

  var obs = Processor(context, splitter, merger, {
    offset: Param(context, 0.1)
  }, releases)

  releases.push(
    Apply(context.audio, delayL.delayTime, Multiply([
      ParamClamp(obs.offset, 0, 1), 0.04
    ])),
    Apply(context.audio, delayR.delayTime, Multiply([
      ParamClamp(obs.offset, -1, 0), -0.04
    ]))
  )
  return obs
}
