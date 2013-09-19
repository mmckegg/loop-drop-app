var Server = require('http').createServer

var microCss = require('micro-css')
var parseUrl = require('url').parse
var join = require('path').join
var fs = require('fs')

var spawn = require('child_process').spawn

/////////

var browserifyPath = whichBrowserify()


var server = Server(function(req, res){
  var url = parseUrl(req.url)

  if (url.pathname == '/'){

    sendHtml(res, {
      title: 'Loop Drop',
      css: ['base'],
      script: ['ui'],
      externalPages: ['engine']
    })

  } else if (url.pathname == '/engine.html'){

    sendHtml(res, {
      script: ['engine'],
      preScript: ['WebMIDIAPI']
    })

  } else if (url.pathname == '/scripts/ui.js'){
    sendScript(res, 'ui')
  } else if (url.pathname == '/scripts/engine.js'){
    sendScript(res, 'engine')
  } else {

    sendResource(req, res)

  }
})

server.listen(9966)
console.log("Navigate to http://localhost:9966/")


//////////////////////////////

var sendResource = require('ecstatic')({
  root: join(__dirname, 'resources'),
  baseDir: '/resources/'
})


function sendHtml(res, options){
  res.writeHead(200, {'content-type': 'text/html'})
  res.write("<!doctype html>\n")

  if (options.title){
    res.write('<title>' + options.title + '</title>\n')
  }

  getCss(options.css, function(err, data){
    if (data){
      res.write(data + "\n")
    }
    if (err){
      console.error(err)
    }

    res.write('<body>\n')
    if (options.externalPages){
      options.externalPages.forEach(function(page){
        res.write('<iframe style="display:none" id="' + page + 'Frame" src="/' + page + '.html" ></iframe>\n')
      })
    }

    if (options.preScript){
      res.write('<script src="/resources/' + options.preScript + '.js"></script>')
    }

    if (options.script){
      res.write('<script src="/scripts/' + options.script + '.js"></script>')
    }
    res.write('</body>')

    res.end()
  })

}


function getCss(files, cb){
  console.log('CSS:', files)

  if (files){
    var data = ''
    forEach(files, function(file, next){
      var path = join(__dirname, 'styles', file + '.mcss')
      fs.readFile(path, function(err, res){
        if (res){
          data += res + "\n"
        }
        next(err)
      })
    }, function(err){
      if (err){
        cb(err)
      } else {
        cb(null, '<style>' + microCss(data) + '</style>')
      }
    })
  } else {
    cb()
  }
}


function sendScript(res, file){
  var path = join(__dirname, 'scripts', file + '.js')

  res.writeHead(200, {'content-type': 'application/javascript'})
  var bfy = spawn(browserifyPath, [path, '-d', '-r', 'through:through'])
  bfy.stdout.pipe(res)
  bfy.stderr.pipe(process.stderr)
}

function whichBrowserify(parsed) {
  var local = join(process.cwd(), 'node_modules/.bin/browserify')
  if (process.platform === 'win32') local += '.cmd'
  if(fs.existsSync(local)) {
    return local
  }
  return 'browserify'
}


function forEach(list, iterator, done){
  var index = -1
  var next = function(err){
    index += 1
    if (list && !err && index < list.length){
      iterator(list[index], next)
    } else {
      done&&done(err)
    }
  }
  next()
}