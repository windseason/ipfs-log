'use strict'

class MemStore {
  constructor () {
    this._store = {}
  }

  async put (data) {
    const hash = "MEM" + (Math.random() * 100000000).toString()
    // const hash = await createMultihash(data)
    if (!this._store) this._store = {}
    this._store[hash] = data
    return Promise.resolve({
      toJSON: () => {
        return {
          data: data,
          multihash: hash,
        }
      }
    })
  }

  async get (key) {
    return Promise.resolve({
      toJSON: () => {
        return {
          data: this._store[key],
          multihash: key,
        }
      }
    })
  }
}


module.exports = MemStore
