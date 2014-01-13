var become = require('become')
var render = require('../../views').nodeEditor
var jsonQuery = require('json-query')

var relativeQuery = /^[\.\[:]/

var dataFilters = {
  path: function(input, params){
    var result = ''
    if (input){
      result = this.query
      if (this.parentContext && relativeQuery.exec(result)){
        result = dataFilters.path.call(this.parentContext, this.parentContext.source) + result
      }
      if (params && params.args[0]){
        result += '.' + params.args[0]
      }
    }
    return result
  },
  text: function(input, params){
    return params.args[0]
  },
  isLinked: function(input){
    return input && input.$
  }
}

module.exports = function(container){
  var currentDeck = null
  var current = {
    slot: null,
    id: null,
    deckId: null
  }

  window.events.on('selectSlot', function(deckId, slotId){

    current.deckId = deckId
    current.id = String(slotId)

    var deck = window.context.decks[deckId]
    if (deck != currentDeck){
      if (currentDeck){
        deck.removeListener('change', handleData)
      }
      currentDeck = deck
      currentDeck.on('change', handleData)
    }

    current.slot = deck.getDescriptor(slotId)
    update()
  })

  function get(query){
    return jsonQuery(query, this).value
  }

  window.events.on('updateActiveSlot', function(path, value){
    var newObject = obtain(current.slot)
    var res = jsonQuery(path, {rootContext: newObject})
    if (res.key != null){
      var obj = jsonQuery.lastParent(res)
      if (obj){
        obj[res.key] = value
        currentDeck.update(newObject)
        window.events.emit('kitChange', current.deckId)
      }
    }
  })

  window.events.on('appendToActiveSlot', function(path, value){
    var newObject = obtain(current.slot)
    var res = jsonQuery(path, {rootContext: newObject, force: []})
    if (res.key != null){

      var obj = res.value
      if (Array.isArray(obj)){
        obj.push(value)
        currentDeck.update(newObject)
        window.events.emit('kitChange', current.deckId)
      }
    }
  })

  window.events.on('deleteFromActiveSlot', function(path){
    var newObject = obtain(current.slot)
    var res = jsonQuery(path, {rootContext: newObject})
    if (res.key != null){
      var obj = jsonQuery.lastParent(res)
      if (obj){
        if (Array.isArray(obj)){
          obj.splice(res.key, 1)
        } else {
          delete obj[res.key]
        }
        currentDeck.update(newObject)
        window.events.emit('kitChange', current.deckId)
      }
    }
  })

  function update(){
    var newContent = render({get: get, rootContext: current.slot, filters: dataFilters})
    become(container, newContent, {inner: true, onChange: window.behave})
  }

  function handleData(data){
    var activeEditor = getNodeEditorElement(document.activeElement)
    if (data.id == current.id){
      current.slot = data
      if (activeEditor !== container){
        update()
      }
    }
  }
}

module.exports.deleteButton = function(element){
  element.onclick = function(e){
    var nodeElement = getNodeElement(e.target)
    if (nodeElement){
      var path = nodeElement.dataset.path
      window.events.emit('deleteFromActiveSlot', path)
    }
  }
}

module.exports.spawner = function(container){
  container.addEventListener('click', function(e){
    var element = getLink(e.target)
    if (element){
      window.events.emit('appendToActiveSlot', container.dataset.path, {type: element.dataset.type})
    }
  })
}

module.exports.select = function(element){
  element.onchange = function(){
    window.events.emit('updateActiveSlot', element.dataset.path, element.value)
  }

  function refresh(){
    element.value = element.dataset.value
  }

  refresh()
  return refresh
}

function getNodeEditorElement(node){
  while (node && !node.classList.contains('NodeEditor')){
    node = node.parentNode
    if (node === document) { 
      node = null 
    }
  }
  return node
}

function getNodeElement(node){
  while (node && !node.classList.contains('Node')){
    node = node.parentNode
    if (node === document) { 
      node = null 
    }
  }
  return node
}

function getLink(node){
  while (node && !node.nodeName === 'A'){
    node = node.parentNode
  }
  return node
}

function obtain(obj){
  return JSON.parse(JSON.stringify(obj))
}