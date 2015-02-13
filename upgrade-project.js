var mkdirp = require('mkdirp')
var fs = require('fs')
var path = require('path')
////


upgradeProject(
  "/Users/matt/Projects/Destroy With Science/Drop",
  "/Users/matt/Projects/Destroy With Science/Drop2"
)


function upgradeProject(original, output){
  mkdirp.sync(output)
  fs.readdirSync(original + '/setups').forEach(function(setupName){
    if (path.extname(setupName) === '.json'){

      var base = path.basename(setupName, '.json')
      var setupOutput = output + '/' + base
      console.log(setupOutput)

      var setup = JSON.parse(fs.readFileSync(original + '/setups/' + setupName, 'utf8'))
      fs.mkdirSync(setupOutput)

      if (Array.isArray(setup.chunks)){
        setup.chunks.forEach(function(ext){
          if (ext && ext.node == 'external' && ext.src && ext.id){
            var chunk = JSON.parse(fs.readFileSync(original + '/' + ext.src, 'utf8'))

            if (Array.isArray(chunk.triggerSlots)){
              chunk.triggerSlots.forEach(function(slot){
                if (slot && Array.isArray(slot.sources)){
                  slot.sources.forEach(function(source){
                    if (source && source.url){
                      fs.writeFileSync(setupOutput + '/' + source.url, fs.readFileSync(original + '/samples/' + source.url))
                      source.buffer = { node: 'AudioBuffer', src: './' + source.url }
                      ;delete source.url
                    }
                  })
                }
              })
            }

            fs.writeFileSync(setupOutput + '/' + ext.id + '.json', JSON.stringify(chunk))
          }
          ext.src = './' + ext.id + '.json'
        })
      }

      fs.writeFileSync(setupOutput + '/index.json', JSON.stringify(setup))
    }
  })
}

function onCopyCompleted(){

}