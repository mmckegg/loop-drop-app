module.exports = findItemByPath

function findItemByPath (items, path) {
  if (items) {
    return items.find(item => item.path() === path)
  }
}
