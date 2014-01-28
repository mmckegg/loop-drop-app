var h = require('create-element')
var become = require('become')

module.exports = function(container){
  var thisDeckId = getDeckElement(container).dataset.id

  window.events.on('refreshKits', refresh)
  window.events.on('addKit', refresh)

  window.events.on('renameKit', function(oldId, newId){
    if (currentKitId === oldId){
      currentKitId = newId
    }
  })

  var currentKitId = null
  var changed = false

  function deselect(){
    var elements = container.querySelectorAll('.-selected')
    for (var i=0;i<elements.length;i++){
      elements[i].classList.remove('-selected')
    }
    currentKitId = null
  }

  window.events.on('kitChange', function(deckId){
    if (deckId === thisDeckId){
      var element = getKit(currentKitId)
      if (element){
        element.classList.add('-changed')
      }
      changed = true
    }
  })

  window.events.on('loadKit', function(deckId, kitId){
    if (deckId === thisDeckId){
      var oldElement = getKit(currentKitId)
      if (oldElement){
        oldElement.classList.remove('-changed')
      }
      deselect()
      var element = getKit(kitId)
      if (element){
        element.classList.remove('-changed')
        element.classList.add('-selected')
      }
      currentKitId = kitId
    }
  })

  window.events.on('newKit', function(deckId, kitId){
    if (deckId === thisDeckId){
      deselect()
      currentKitId = null
    }
  })

  window.events.on('saveKit', function(deckId, kitId){
    if (deckId === thisDeckId){
      if (deckId === thisDeckId){
        var element = getKit(kitId)
        if (element){
          element.classList.remove('-changed')
          if (currentKitId === kitId){
            changed = false
          }
        }
      }
    }
  })

  function getKit(kitId){
    return container.querySelector('[data-id="' + kitId + '"]')
  }

  function refresh(){
    var controls = ' <div class=".controls"><a class=".delete">Delete</a> <a class=".save">Save</a></div>'
    var newHtml = window.context.kits.map(function(entry){
      var name = getName(entry.name)
      return h('div', {'data-id': name}, h('span', escapeHTML(name)) + controls)
    }).join('\n')

    newHtml += '\n<div class=".saveAs">Save As...</div>\n<div class=".new">New Kit</div>'

    become(container, newHtml, {inner: true, ignoreAttributes: ['contenteditable']})

    // fix selected state
    var selectedElement = getKit(currentKitId)
    if (selectedElement){
      selectedElement.classList.add('-selected')
      if (changed){
        selectedElement.classList.add('-changed')
      }
    }
  }

  function beginRename(element){
    if (element.contentEditable != true){
      var kitElement = getKitElement(element)
      var kitId = kitElement.dataset.id
      element.contentEditable = true
      element.onblur = endRename
      element.onkeydown = handleRenameKey
      element.originalHTML = element.innerHTML
      selectInside(element)
    }
  }

  function beginAdd(insertPoint){
    var editor = document.createElement('div')
    editor.classList.add('-selected')
    editor.classList.add('-changed')

    var controls = document.createElement('div')
    controls.classList.add('.controls')
    controls.innerHTML = '<a class=".save">Save</a> <a class=".cancel">Cancel</a>'

    var span = document.createElement('span')
    span.contentEditable = true
    span.textContent = 'New Kit'
    editor.appendChild(span)
    editor.appendChild(controls)

    controls.onmousedown = function(event){
      if (event.target.classList.contains('.cancel')){
        span.onblur = null
        span.onkeydown = null
        editor.parentNode.removeChild(editor)
        refresh()
      }
    }
    insertPoint.style.display = 'none'
    editor.dataset.preserve = true
    insertPoint.parentNode.insertBefore(editor, insertPoint)
    span.onblur = endAdd
    span.onkeydown = handleNewKey
    span.focus()
    setTimeout(function(){
      selectInside(span)
    })
  }

  function handleNewKey(event){
    if (event.keyCode === 13 || event.keyCode === 27){
      endAdd(event)
      return false
    }
  }

  function endAdd(event){
    var element = event.target
    var parent = element.parentNode

    element.onblur = null
    element.onkeydown = null
    element.contentEditable = false

    if (parent.parentNode){
      if (event.keyCode === 27 || event.target.classList.contains('.cancel')){
        parent.parentNode.removeChild(parent)
        refresh()
      } else {
        var newName = element.textContent.trim()
        parent.parentNode.removeChild(parent)
        if (newName){
          currentKitId = newName
          window.events.emit('saveKit', thisDeckId, newName)
        }
      }
    }
  }

  function handleRenameKey(event){
    if (event.keyCode === 13 || event.keyCode === 27){
      endRename(event)
      return false
    }
  }

  function endRename(event){
    var element = event.target
    var kitElement = getKitElement(event.target)
    element.onblur = null
    element.handleRenameKey = null
    element.contentEditable = false
    if (event.keyCode === 27){
      element.innerHTML = element.originalHTML
    } else {
      var newName = element.textContent.trim()
      var oldName = kitElement.dataset.id
      if (newName != oldName){
        window.events.emit('renameKit', oldName, newName)
      }
    }
  }

  container.addEventListener('click', function(event){

    if (event.target.classList.contains('.saveAs')){
      beginAdd(event.target)
      return false
    }

    if (event.target.classList.contains('.new')){
      window.events.emit('newKit', thisDeckId)
      return false
    }

    var kitElement = getKitElement(event.target)
    if (kitElement){
      var kitId = kitElement.dataset.id
      if (event.target.classList.contains('.delete')){
        window.events.emit('deleteKit', kitId)
      } else if (event.target.classList.contains('.save')){
        window.events.emit('saveKit', thisDeckId, kitId)
      } else if (event.target.nodeName === 'SPAN' && kitElement.classList.contains('-selected')){
        //TODO: this should be confirmed!
        beginRename(event.target)
      } else {
        if (kitId != currentKitId){
          window.events.emit('loadKit', thisDeckId, kitId)
        }
      }
    }
  })
}

function getName(fileName){
  return fileName.replace(/\.[a-z0-9]+/, '')
}

function escapeHTML(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getKitElement(node){
  while (node && !node.getAttribute('data-id')){
    if (node.classList.contains('.kits')) { // too far
      return false
    }
    node = node.parentNode
  }
  return node
}

function getDeckElement(node){
  while (node && !node.classList.contains('Deck')){
    node = node.parentNode
  }
  return node
}

function selectInside(element){
  var range = document.createRange();
  range.selectNodeContents(element);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range)
}