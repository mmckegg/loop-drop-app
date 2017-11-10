var createDatNode = require('./create-dat-node')

module.exports = {
  name: 'dat',
  node: 'dat-chunk',
  group: 'simpleChunks',
  description: 'Load a chunk from dat p2p',
  action: (opts, cb) => {
    console.log('spwan', opts)
    createDatNode(opts.collection, opts.index, opts.context, opts.fileObject, cb)
  }
}
