module.exports = WaveSvg

function WaveSvg (path, options) {
  return computed(path, function (path) {
    var svg = Value()
    var svgPath = path + '.svg'
    options.fs.readFile(svgPath, 'utf8', function (err, value) {
      if (err) {
        decodeRange = RangeDecoder(path, options, function (err, res) {
          if (err) return onDone && onDone(err)
          meta = res
          remaining = meta.duration
          nextChunk()
        })

        // cue points
        var timePath = path + '.time'
        options.fs.readFile(timePath, function (err, buffer) {
          if (!err) {
            var data = new Float32Array(new Uint8Array(buffer).buffer)
            markerPath = svg('path', {
              d: getMarkerPath(data, scale, height),
              fill: 'rgba(255,255,255,0.1)'
            })
            refresh()
          }
        })
      } else {
        obs.set(value)
        onDone && onDone(null, value)
      }
    })
    return svg
  })
}
