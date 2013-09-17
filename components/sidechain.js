
module.exports = function(audioContext){
  var input = audioContext.createGainNode()

  var split = audioContext.createChannelSplitter(2)
  var monoSum = audioContext.createGainNode()

  input.connect(split)
  split.connect(monoSum, 0, 0)
  split.connect(monoSum, 1, 0)

  return {
    getDipperNode: function(){
      var dipperIn = audioContext.createGainNode()
      var dipperOut = audioContext.createGainNode()
      dipperIn.gain.value = 0.25
      dipperOut.gain.value = 2

      var inSplit = audioContext.createChannelSplitter(2)

      var lMerge = audioContext.createChannelMerger(2)
      var rMerge = audioContext.createChannelMerger(2)

      var lComp = audioContext.createDynamicsCompressor()
      var rComp = audioContext.createDynamicsCompressor()

      lComp.ratio.value = 5
      rComp.ratio.value = 5

      lComp.release.value = 0.1
      rComp.release.value = 0.1

      lComp.threshold.value = -20
      rComp.threshold.value = -20

      var lSplit = audioContext.createChannelSplitter(2)
      var rSplit = audioContext.createChannelSplitter(2)

      var inMerge = audioContext.createChannelMerger(2)

      monoSum.connect(lMerge, 0, 0)
      monoSum.connect(rMerge, 0, 0)

      inSplit.connect(lMerge, 0, 1)
      inSplit.connect(rMerge, 1, 1)

      lMerge.connect(lComp)
      rMerge.connect(rComp)

      lComp.connect(lSplit)
      rComp.connect(rSplit)

      lSplit.connect(inMerge, 1, 0)
      rSplit.connect(inMerge, 1, 1)

      dipperIn.connect(inSplit)
      inMerge.connect(dipperOut)

      return {
        input: dipperIn,
        output: dipperOut
      }

    },
    input: input,
    output: input
  }

}