const startIPFS = require('./utils/start-ipfs')
const Log = require('../src/log')

module.exports = [{
  name: 'append',
  prepare: async function () {
    this._ipfs = await startIPFS('./ipfs-log-benchmarks/ipfs')
    const log = new Log(this._ipfs, 'A')
    return log
  },
  cycle: async function (log) {
    await log.append('Hello')
  },
  while: (stats, startTime) => {
    return process.hrtime(startTime)[0] < 10
  },
  teardown: async function() {
    //this._ipfs.stop(done) // TODO: get Already Stopped Error??
  }
}, {
  name: 'fromEntryHash',
  count: 10000,
  prepare: async function () {
    this._ipfs = await startIPFS('./ipfs-log-benchmarks/fromEntryHash/ipfs')
    const log = new Log(this._ipfs, 'A')

    const refCount = 64
    for (let i = 1; i < this.count + 1; i ++) {
      await log.append('hello' + i, refCount)
      process.stdout.write(`\rWriting ${i} / ${this.count}`)
    }
    return log
  },
  while: (stats, startTime) => {
    return stats.count < 1
  },
  cycle: async function (log) {
    const onDataUpdated = (hash, entry, resultLength, result, queue) => {
      total = resultLength
      process.stdout.write(`\rLoading ${total} / ${this.count}`)
    }
    const result = await Log.fromEntryHash(
      this._ipfs,
      log.heads.map(e => e.hash),
      log._id,
      -1,
      [],
      log._key,
      log._keys,
      onDataUpdated
    )
  },
  teardown: async function() {
    //this._ipfs.stop(done) // TODO: get Already Stopped Error??
  }
}]
