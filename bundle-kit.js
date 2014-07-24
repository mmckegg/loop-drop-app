var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')

var file = process.argv[2]
var dest = process.argv[3]

if (file && dest){
  var dir = path.dirname(file)
  var base = path.dirname(dir)
  var sampleDir = path.join(base, 'samples')
  var kit = JSON.parse(fs.readFileSync(file))

  var kitOut = path.join(dest, 'kits')
  var sampleOut = path.join(dest, 'samples')

  mkdirp.sync(kitOut)
  mkdirp.sync(sampleOut)

  var outFile = path.join(kitOut, path.basename(file))

  // write kit
  fs.writeFileSync(outFile, JSON.stringify(kit))

  // get sample list
  getSamples(kit).forEach(function(fileName){
    var from = path.join(sampleDir, fileName)
    var to = path.join(sampleOut, fileName)
    if (fs.existsSync(from)){
      console.log(fileName)
      fs.createReadStream(from).pipe(fs.createWriteStream(to))
    }
  })

} else {
  console.log('you must specify kit to package and target directory')
}

function getSamples(object, list){
  list = list || []
  for (var key in object){
    var value = object[key]
    if (key === 'url'){
      list.push(value)
    } else if (value instanceof Object) {
      getSamples(value, list)
    }
  }
  return list
}
