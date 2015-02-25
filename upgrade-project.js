var mkdirp = require('mkdirp')
var fs = require('fs')
var path = require('path')
////

var scales = {
  'major': [ 0, 2, 4, 5, 7, 9, 11 ],
  'dorian': [ 0, 2, 3, 5, 7, 9, 10 ],
  'phrygian': [ 0, 1, 3, 5, 7, 8, 10 ],
  'lydian': [ 0, 2, 4, 6, 7, 9, 11 ],
  'mixolydian': [ 0, 2, 4, 5, 7, 9, 10 ],
  'minor': [ 0, 2, 3, 5, 7, 8, 10 ],
  'locrian': [ 0, 1, 3, 5, 6, 8, 10 ],
  'majorpentatonic': [ 0, 2, 4, 7, 9 ],
  'chromatic': [0,1,2,3,4,5,6,7,8,9,10,11]
}

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
            var newSrc = ext.id + '.json'
            upgradeChunk(original, ext.src, setupOutput, newSrc)
            upgradeExternal(ext, newSrc)
          }
        })
      }

      fs.writeFileSync(setupOutput + '/index.json', JSON.stringify(setup))
    }
  })
}

function upgradeChunk(oldRoot, src, setupDir, newSrc){
  var chunk = JSON.parse(fs.readFileSync(oldRoot + '/' + src, 'utf8'))
  findAndUpdateModulators(chunk)

  if (Array.isArray(chunk.slots)){
    chunk.slots.forEach(function(slot){
      if (slot){
        upgradeSlot(slot, oldRoot, setupDir)
      }
    })
  } else {
    chunk.slots = []
  }

  if (chunk.triggerSlots && chunk.triggerSlots[1] && chunk.triggerSlots[1].node === 'inherit'){
    chunk.node = 'chunk/range'
  }

  if (chunk.node === 'chunk'){
    if (Array.isArray(chunk.triggerSlots)){
      chunk.triggerSlots.forEach(function(slot, i){
        if (slot){
          slot.id = String(i)
          upgradeSlot(slot, oldRoot, setupDir)
          chunk.slots.push(slot)
        }
      })
    }
  } else if (chunk.node === 'chunk/range'){
    if (chunk.triggerSlots && chunk.triggerSlots[0]){
      var slot = chunk.triggerSlots[0]
      slot.id = { $param: 'id' }
      slot.noteOffset = { 
        node: 'modulator/scale', 
        value: { $param: 'value' },
        offset: { $param: 'offset' },
        scale: { $param: 'scale' }
      }

      upgradeSlot(slot, oldRoot, setupDir)
      upgradeScale(chunk, slot)
      chunk.templateSlot = slot
    }
    chunk.node = 'chunk/scale'
  }

  if (chunk.selectedSlotId === 'trigger'){
    chunk.selectedSlotId = '$template'
  }

  ;delete chunk.triggerSlots
  fs.writeFileSync(setupDir + '/' + newSrc, JSON.stringify(chunk))
}

function upgradeSlot(node, oldRoot, setupDir){
  if (Array.isArray(node.sources)){
    node.sources.forEach(function(source){
      upgradeSource(source, oldRoot, setupDir)
    })
  }

  if (Array.isArray(node.processors)){
    node.processors.forEach(function(processor){
      upgradeProcessor(processor, oldRoot, setupDir)
    })
  }

  if (node.id !== 'output' && !node.output){
    node.output = 'output'
  }

  node.node = 'slot'
}

function upgradeScale(chunk, slot){
  var notes = scales.major
  var offset = 0

  slot.sources.forEach(function(source, i){

    if (source.note instanceof Object && source.note.node === 'input'){
      source.note = source.note.value
    }

    if (source.note instanceof Object && source.note.node === 'scale'){
      if (i){
        var value = source.note.root - 69 - offset
        source.octave = Math.floor(value / 12)
        source.noteOffset = value - (source.octave * 12)
      } else {
        notes = scales[source.note.scale]
        var noteOffset = source.note.root - 69
        source.octave = Math.floor(noteOffset / 12)
        source.noteOffset = 0
        offset = noteOffset - (source.octave * 12)
      }
      ;delete source.note
    } else if (source.transpose instanceof Object && source.transpose.node === 'scale'){
      if (i){
        source.transpose = source.transpose.root - offset
      } else {
        notes = scales[source.transpose.scale]
        offset = source.transpose.root
        source.transpose = 0
      }
    }
  })

  chunk.scale = {
    notes: notes,
    offset: offset
  }
}

function upgradeProcessor(node, oldRoot, setupDir){
  node.node = 'processor/' + node.node
}

function upgradeSource(node, oldRoot, setupDir){
  node.node = 'source/' + node.node
  if (node.url){
    fs.writeFileSync(setupDir + '/' + node.url, fs.readFileSync(oldRoot + '/samples/' + node.url))
    node.buffer = { node: 'AudioBuffer', src: './' + node.url }
    ;delete node.url
  }

  if (typeof node.note === 'number'){
    var offset = node.note - 69
    node.octave = Math.floor(offset / 12)
    node.noteOffset = offset - (node.octave * 12)
    ;delete node.note
  } 

  if (node.frequency instanceof Object){
    node.detune = node.frequency

    if (node.detune.value){
      var base = node.detune.value
      node.detune.value = 120 * Math.log(base / 440) / Math.log(2)
      if (node.detune.mode == 'add'){
        node.detune.amp = 12 * Math.log(Math.max(1, node.detune.amp)) / Math.log(2)
      }
    }

    ;delete node.frequency
  }

  if (node.node === 'source/granular'){
    node.duration = node.length
    ;delete node.length
  }
}

function findAndUpdateModulators(object){
  JSON.stringify(object, function(k,v){
    if (v instanceof Object){
      if (v.node === 'lfo'){

        if (v.shape === 'sine' || v.shape === 'triangle'){
          v.curve = 1
          v.skew = 0
        } else if (v.shape === 'square'){
          v.curve = 0
          v.skew = 0
        } else if (v.shape === 'sawtooth'){
          v.curve = 1
          v.skew = 1
        } else if (v.shape === 'sawtooth_i'){
          v.curve = 1
          v.skew = -1
        }

        if (!v.mode){
          v.mode = 'add'
        }

        v.trigger = true
        v.node = 'modulator/lfo'

      } else if (v.node === 'adsr'){
        
        if (v.decay){
          v.decay = v.decay * 1.8
        }

        if (v.attack && v.startValue && v.startValue > v.value){
          v.sustain = v.value / v.startValue
          v.value = v.startValue
          v.decay = v.attack
          v.attack = 0
          ;delete v.startValue
        }

        v.node = 'modulator/adsr'
      }
    } 
    return v
  })
}

function upgradeExternal(node, newSrc){
  if (node.routes && (!node.routes.output || node.routes.output === 'meddler')){
    node.routes.output = '$default'
  }

  if (!node.routes){
    node.routes = {output: '$default'}
  }
  node.src = './' + newSrc
}

function onCopyCompleted(){}