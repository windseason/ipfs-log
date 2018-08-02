const startIPFS = require('./utils/start-ipfs')
const releaseRepo = require('./utils/release-repo')
const Log = require('../src/log')

const base = {
  prepare: async function () {
    const { ipfs, repo } = await startIPFS('./ipfs-log-benchmarks/ipfs')
    this._repo = repo
    const log = new Log(ipfs, 'A')
    return log
  },
  cycle: async function (log) {
    await log.append('Hello')
  },
  teardown: async function() {
    await releaseRepo(this._repo)
  }
}

const baseline = {
  name: 'append-baseline',
  while: (stats, startTime) => {
    return stats.count < 1000
  }
}

const stress = {
  name: 'append-stress',
  while: (stats, startTime) => {
    return process.hrtime(startTime)[0] < 300
  }
}

module.exports = [
  {...base, ...baseline},
  {...base, ...stress}
]
