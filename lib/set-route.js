var QueryParam = require('lib/query-param')

module.exports = function setRoute(node, id, value) {
  if (node.routes) {
    node.routes.put(id, value)
  } else {
    QueryParam(node, ['routes[?]', id], {}).set(value)
  }
}
