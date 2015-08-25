module.exports = function copyFile (from, to, fs, cb) {
  fs.createReadStream(from).on('error', cb)
    .pipe(fs.createWriteStream(to)).on('error', cb)
    .on('finish', cb)
}