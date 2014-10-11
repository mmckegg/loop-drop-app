var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

module.exports = function(element, state, actions){
  var setupBrowser = require('./browser.js')(state.setups, actions.setups)
  var chunkBrowser = require('./browser.js')(state.chunks, actions.chunks)
  var setupEditor = require('./tabbed-editor.js')(state.setups, actions.setups)
  var chunkEditor = require('./tabbed-editor.js')(state.chunks, actions.chunks)


  var loop = mercury.main(state, function(data){
    return h('Holder', [
      h('div.browser', [
        setupBrowser('Setups'),
        chunkBrowser('Chunks')
      ]),
      h('div.main', [
        setupEditor(),
        chunkEditor()
      ])
    ])
  })

  state(loop.update)
  element.appendChild(loop.target)

  return function(){
    loop.update(state())
    console.log('force update')
  }
}