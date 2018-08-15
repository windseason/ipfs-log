const startIPFS = require('./utils/start-ipfs')
const releaseRepo = require('./utils/release-repo')
const Log = require('../src/log')

const base = {
  prepare: async function () {
    const { ipfs, repo } = await startIPFS('./ipfs-log-benchmarks/fromEntry/ipfs')
    this._ipfs = ipfs
    this._repo = repo

    const log = new Log(this._ipfs, 'A')
    const refCount = 64
    for (let i = 1; i < this.count + 1; i ++) {
      await log.append('hello' + i, refCount)
    }

    this.head = log.heads[0]
    return log
  },
  cycle: async function (log) {
    await Log.fromEntry(this._ipfs, this.head)
  },
  teardown: async function() {
    await releaseRepo(this._repo)
  }
}

const baseline = {
  while: (stats, startTime) => {
    return stats.count < 1000
  }
}

const stress = {
  while: (stats, startTime) => {
    return process.hrtime(startTime)[0] < 300
  }
}

const counts = [1, 100, 1000, 10000]
let benchmarks = []
for (const count of counts) {
  const c = { count }
  if (count < 1000) benchmarks.push({ name: `fromEntry-${count}-baseline`, ...base, ...c, ...baseline })
  benchmarks.push({ name: `fromEntry-${count}-stress`, ...base, ...c, ...stress })
}

module.exports = benchmarks
