var Dat = require('dat-node')

module.exports = function (dir, done) {
  Dat(dir, function (err, dat) {
    if (err) return done(err)
    dat.importFiles({watch: true})
    dat.joinNetwork()
    var link  = 'dat://' +  dat.key.toString('hex')
    done(null, {dat: dat, link: link})
  })
}
