const startIPFS = require('./utils/start-ipfs')
const Log = require('../src/log')

const append = require('./append.js')
const fromEntryHash = require('./from-entry-hash.js')
const get = require('./get.js')
const has = require('./has.js')
const heads = require('./heads.js')
const join = require('./join.js')
const tailHashes = require('./tail-hashes.js')
const tails = require('./tails.js')
const toMultihash = require('./to-multihash.js')
const toString = require('./to-string.js')
const values = require('./values.js')

module.exports = [
  ...append,
  ...fromEntryHash,
  ...get,
  ...has,
  ...heads,
  ...join,
  ...tailHashes,
  ...tails,
  ...toMultihash,
  ...toString,
  ...values
]
