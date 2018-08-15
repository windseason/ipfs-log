const startIPFS = require('./utils/start-ipfs')
const Log = require('../src/log')

const append = require('./append.js')
const fromEntryHash = require('./from-entry-hash.js')
const get = require('./get.js')
const heads = require('./heads.js')
const join = require('./join.js')
const tailHashes = require('./tail-hashes.js')
const tails = require('./tails.js')
const values = require('./values.js')

module.exports = [
  ...append,
  ...fromEntryHash,
  ...get,
  ...heads,
  ...join,
  ...tailHashes,
  ...tails,
  ...values
]
