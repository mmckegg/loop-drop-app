module.exports = findItemByPath

function findItemByPath(items, path){
  var result = null
  if (items){
    items.some(function(item){
      if (item.path === path){
        result = item
        return true
      }
    })
  }
  return result
}