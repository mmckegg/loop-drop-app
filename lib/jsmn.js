var safeEval = require('notevil')

module.exports.parse = function(literal){
  literal = literal.replace(/\{\{([\w\W]*?)\}\}/g, function(_, exp){
    return '{$: ' + JSON.stringify(exp) + '}'
  })
  return safeEval('j = {' + literal + '}')
}

module.exports.stringify = function(object){
  return getObjectContent(object).trim()
}

module.exports.eval = xval

function xval(object, context){
  if (Array.isArray(object)){
    return object.map(function(x){
      return xval(x, context)
    })
  } else if (object instanceof Object) {
    if (object.$){
      return safeEval(object.$, context)
    } else {
      var res = {}
      Object.keys(object).forEach(function(key){
        res[key] = xval(object[key], context)
      })
      return res
    }
  } else {
    return object
  }
}

function getObjectContent(object){
  var result = Object.keys(object).map(function(key){
    return escapeKey(key) + ': ' + getLiteral(object[key])
  })
  return smartWrap(result)
}

function escapeKey(key){
  if (~key.indexOf(' ') || ~key.indexOf('"')){
    return JSON.stringify(String(key))
  } else {
    return key
  }
}

function getArrayContent(array){
  var result = array.map(function(obj){
    return getLiteral(obj)
  })
  return smartWrap(result)
}

function smartWrap(array){
  if (array.join(', ').length>30){
    return '\n' + array.join(',\n') + '\n'
  } else {
    return ' ' + array.join(', ') + ' '
  }
}

function indent(text){
  return text.replace(/\n(.)/g, '\n  $1')
}

function getLiteral(value){
  if (!value || typeof value !== 'object'){
    return JSON.stringify(value)
  } else if (Array.isArray(value)){
    return '[' + indent(getArrayContent(value)) + ']'
  } else if (value && '$' in value){
    return '{{' + value['$'] + '}}'
  } else {
    return '{' + indent(getObjectContent(value)) + '}'
  }
}