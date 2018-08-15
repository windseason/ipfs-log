const startIPFS = require('./utils/start-ipfs')
const Log = require('../src/log')

const append = require('./append.js')
const fromEntryHash = require('./from-entry-hash.js')
const heads = require('./heads.js')
const join = require('./join.js')
const values = require('./values.js')

module.exports = [
  ...append,
  ...fromEntryHash,
  ...heads,
  ...join,
  ...values
]
