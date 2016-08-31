var Path = require('path')
var fs = require('fs')
var spawn = require('child_process').spawn

var input = process.argv[2]
var output = process.argv[3]

if (!input || !output) {
  throw new Error('Must specify input.json and output file')
}

var dir = Path.dirname(input)
var base = Path.basename(input, '.json')

fs.readdir(dir, function (err, files) {
  if (err) throw err
  files = files.filter(f => f.startsWith(base + '-'))

  fs.writeFileSync(output + '.txt', files.map(x => `file '${Path.join(dir, x)}'`).join('\n'))
  var args = ['-f', 'concat', '-safe', '0', '-i', output + '.txt', '-af', 'volume=0.8', output]
  spawn('ffmpeg', args, {stdio: 'inherit'})
})
