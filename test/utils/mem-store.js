'use strict'

const multihashing = require('multihashing-async')
const mh = require('multihashes')

const defaultHashAlg = 'sha2-256'

const createMultihash = (data, hashAlg) => {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.from(JSON.stringify(data))

    multihashing(buffer, hashAlg || defaultHashAlg, (err, multihash) => {
      if (err) {
        return reject(err)
      }

      resolve(mh.toB58String(multihash))
    })
  })
}

const transformLinksIntoCids = (data) => {
  if (!data) {
    return data
  }

  if (data['/']) {
    const hash = data['/']

    return {
      toBaseEncodedString: () => hash
    }
  }

  if (Array.isArray(data)) {
    return data.map(transformLinksIntoCids)
  }

  if (typeof data === 'object') {
    return Object.keys(data).reduce((obj, key) => {
      obj[key] = transformLinksIntoCids(data[key])

      return obj
    }, {})
  }

  return data
}

/* Memory store using an LRU cache */
class MemStore {
  constructor () {
    this._store = new Map()
  }

  async put (value) {
    const data = value
    const hash = await createMultihash(data)

    this._store.set(hash, data)

    return {
      toBaseEncodedString: () => hash
    }
  }

  async get (key) {
    const data = this._store.get(key)

    return {
      value: transformLinksIntoCids(data)
    }
  }
}

module.exports = MemStore
