var Through = require('through')

module.exports = function(){
  var grabber = Through(function(data){
    var filter = getFilter(data)
    if (filter){
      filter.cb(data)
    } else {
      this.queue(data)
    }
  })

  function getFilter(data){
    var result = null
    filters.some(function(filter){
      if (
        checkFilter(filter[0], data[0]) && 
        checkFilter(filter[1], data[1]) && 
        checkFilter(filter[2], data[2]) 
      ) {
        result = filter
        return true
      }
    })
    return result
  }

  var filters = []

  grabber.grab = function(f, cb){
    
    var filter = ['144..159', null, null]

    if (!cb && typeof f == 'function'){
      cb = f
    } else {
      filter[0] = f[0]
      filter[1] = f[1]
      filter[2] = f[2]
    }

    filter.cb = cb
    filters.unshift(filter)

    return function(){
      // delete
      var id = filters.indexOf(filter)
      filters.splice(id, 1)
    }
  }

  return grabber
}

function checkFilter(filter, value){
  if (filter == null || filter === value){
    return true
  } else if (typeof filter == 'string') {
    if (~filter.indexOf('...')){
      var range = filter.split('...')
      return value >= parseInt(range[0]) && value < parseInt(range[1])
    } else if (~filter.indexOf('..')){
      var range = filter.split('..')
      return value >= parseInt(range[0]) && value <= parseInt(range[1])
    }
  }
}