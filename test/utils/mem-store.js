'use strict'
const multihashing = require('multihashing-async')
const mh = require('multihashes')
const defaultHashAlg = 'sha2-256'
const defaultFormat = { format: 'dag-cbor', hashAlg: 'sha2-256' }

const createMultihash = (data, hashAlg) => {
  return new Promise((resolve, reject) => {
    multihashing(data, hashAlg || defaultHashAlg, (err, multihash) => {
      if (err)
        return reject(err)
      resolve(mh.toB58String(multihash))
    })
  })
}

/* Memory store using an LRU cache */
class MemStore {
  constructor (ipfs) {
    this._store = {}// new LRU(1000)
    this._ipfs = ipfs
  }

  async put (value) {
    const data = value// new Buffer(JSON.stringify(value))
    const hash = await createMultihash(data)

    if (!this._store) this._store = {}
    this._store[hash] = data

    return {
      toBaseEncodedString: () => hash
    }
  }

  async get (key) {
    return {
      value: this._store[key]
    }
  }
}

module.exports = MemStore
