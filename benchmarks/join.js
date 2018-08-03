const Keystore = require('orbit-db-keystore')

const startIPFS = require('./utils/start-ipfs')
const releaseRepo = require('./utils/release-repo')
const Log = require('../src/log')

const base = {
  prepare: async function () {
    const { ipfs, repo } = await startIPFS('./ipfs-log-benchmarks/ipfs')
    this._repo = repo
    const log1 = new Log(ipfs, 'A')
    const log2 = new Log(ipfs, 'B')
    return { log1, log2 }
  },
  cycle: async function (logs) {
    const { log1, log2 } = logs
    const add1 = await log1.append('Hello1')
    const add2 = await log2.append('Hello2')

    await Promise.all([add1, add2])
    log1.join(log2)
    log2.join(log1)
  },
  teardown: async function() {
    await releaseRepo(this._repo)
  }
}

const signed = {
  prepare: async function () {
    const { ipfs, repo } = await startIPFS('./ipfs-log-benchmarks/ipfs')
    const keystore = Keystore.create('./test-keys')
    const key = keystore.createKey('benchmark-join-signed')
    ipfs.keystore = keystore

    this._repo = repo
    const log1 = new Log(ipfs, 'A', null, null, null, key, key.getPublic('hex'))
    const log2 = new Log(ipfs, 'B', null, null, null, key, key.getPublic('hex'))
    return { log1, log2 }
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

module.exports = [
  { name: 'join-baseline', ...base, ...baseline},
  { name: 'join-stress', ...base, ...stress},
  { name: 'join-signed-baseline', ...base, ...signed, ...baseline},
  { name: 'join-signed-stress', ...base, ...signed, ...stress}
]
