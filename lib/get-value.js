module.exports = getValue

function getValue(object, defaultValue){
  if (object instanceof Object && !Array.isArray(object)){
    return getValue(object.value, defaultValue)
  } else {
    return object != null ? object : defaultValue
  }
}