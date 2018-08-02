const startIPFS = require('./utils/start-ipfs')
const releaseRepo = require('./utils/release-repo')
const Log = require('../src/log')

const base = {
  prepare: async function () {
    const { ipfs, repo } = await startIPFS('./ipfs-log-benchmarks/fromEntryHash/ipfs')
    this._ipfs = ipfs
    this._repo = repo

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
    await Log.fromEntryHash(
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
    await releaseRepo(this._repo)
  }
}

const counts = [1, 100, 1000, 10000]
let benchmarks = []
for (const count of counts) {
  const benchmark = {
    name: `fromEntryHash-${count}`,
    count: count
  }
  benchmarks.push({ ...base, ...benchmark })
}

module.exports = benchmarks
