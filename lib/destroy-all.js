module.exports = function (obs) {
  Object.keys(obs).forEach(function (key) {
    if (obs[key] && typeof obs[key].destroy === 'function') {
      obs[key].destroy()
    }
  })
}
