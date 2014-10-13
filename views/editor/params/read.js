module.exports = function(param){
  if (typeof param == 'function'){
    return param()
  } else if (param && param.read){
    return param.read()
  }
}