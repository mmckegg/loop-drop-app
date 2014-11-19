var colors = require('cli-color')
var watchify = require('watchify')
var catw = require('catw')
var mcss = require('micro-css')
var Concat = require('concat-stream')
var notify = require('growl')

var fs = require('fs')
process.cwd(__dirname)
if (!fs.existsSync('build')){
  fs.mkdirSync('build')
}

var pendingSteps = 0
function pendingStep(){
  pendingSteps += 1
}
function popStep(){
  pendingSteps -= 1
  if (!pendingSteps){
    if (~process.argv.indexOf('-w') || ~process.argv.indexOf('--watch')){
      console.log('Build complete. Watching for changes...')
    } else {
      process.exit()
    }
  }
}

var viewPath = __dirname + '/views'

// index.html
pendingStep()
catw('window.html', function(stream){
  stream.pipe(fs.createWriteStream('build/index.html')).on('finish', popStep)
})

// manifest.json / background.js
pendingStep()
pendingStep()
catw('package.json', function(stream){
  stream.pipe(Concat(function(data){
    var pkg = JSON.parse(data)
    fs.writeFile('build/manifest.json', JSON.stringify({
      name: 'Loop Drop',
      version: pkg.version,
      description: pkg.description,
      author: pkg.author,
      manifest_version: 2,
      permissions: pkg.permissions,
      app: {
        background: {
          scripts: ['background.js']
        }
      },
      icons: {
        48: "icon48.png", 
        128: "icon128.png"
      }
    }, null, 2), popStep)

    fs.writeFile(
      'build/background.js', 
      "chrome.app.runtime.onLaunched.addListener(function() { \n" +
      "  chrome.app.window.create('index.html', " + JSON.stringify(pkg.window || null) + ")\n" +
      "})", popStep
    )

  }))
})

// bundle.css
pendingStep()
catw('styles/*.mcss', function(stream){
  stream.pipe(Concat(function(data){
    fs.writeFile('build/bundle.css', mcss(String(data)), popStep)
  }))
})

// extra.css
pendingStep()
catw('styles/*.css', function(stream){
  stream.pipe(fs.createWriteStream('build/extra.css')).on('finish', popStep)
})

// icon128.png
pendingStep()
fs.createReadStream('icon128.png')
  .pipe(fs.createWriteStream('build/icon128.png'))
  .on('finish', popStep)

// icon48.png
pendingStep()
fs.createReadStream('icon48.png')
  .pipe(fs.createWriteStream('build/icon48.png'))
  .on('finish', popStep)

// bundle.js
pendingStep()
var w = watchify('./index.js')
var pendingBundleError = false
w.on('update', bundle)
bundle()
function bundle(){
  w.bundle({debug: !!~process.argv.indexOf('-d')}).on('error', handleError).pipe(fs.createWriteStream('build/bundle.js')).on('finish', function(){
    popStep()
    handleSucess()
  })
}

function handleSucess(){
  if (pendingBundleError){
    pendingBundleError = false
    console.log('** ' + colors.green('Rebuild successful!') + ' **')
    notify('Rebuild Succeeded', {title: 'Loop Drop'})
  }
}

function handleError(err){
  console.log('** ' + colors.red('REBUILD ERROR') + ' **')
  var message = (err&&err.message||err||'Error').replace(/([\/][^\/ ]+)+(([\/][^\/ ]+){2}( |$))/g, ".$2")
    .replace(/: Line ([0-9]+)/, ":$1")
  console.error(message)
  notify(message, {title: 'Loop Drop', image: 'js'})
  pendingBundleError = true
}