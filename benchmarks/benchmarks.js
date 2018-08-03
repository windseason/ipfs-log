const startIPFS = require('./utils/start-ipfs')
const Log = require('../src/log')

const append = require('./append.js')
const fromEntryHash = require('./from-entry-hash.js')
const join = require('./join.js')

module.exports = [
  ...append,
  ...fromEntryHash,
  ...join
]
