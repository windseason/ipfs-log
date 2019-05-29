const startIPFS = require('./utils/start-ipfs')
const releaseRepo = require('./utils/release-repo')
const createLog = require('./utils/create-log')
const Log = require('../../../src/log')

const base = {
  prepare: async function () {
    const { ipfs, repo } = await startIPFS('./ipfs-log-benchmarks/fromMultihash/ipfs')
    const { log, access, identity } = await createLog(ipfs, 'A')
    const refCount = 64
    process.stdout.clearLine()
    for (let i = 1; i < this.count + 1; i++) {
      process.stdout.write(`\r${this.name} / Preparing / Writing: ${i}/${this.count}`)
      await log.append('hello' + i, refCount)
    }

    const multihash = await log.toMultihash()
    return { ipfs, repo, access, identity, log, multihash }
  },
  cycle: async function ({ log, access, identity, ipfs, multihash }) {
    await Log.fromMultihash(ipfs, identity, multihash, { access })
  },
  teardown: async function ({ repo }) {
    await releaseRepo(repo)
  }
}

const baseline = {
  while: ({ stats, startTime, baselineLimit }) => {
    return stats.count < baselineLimit
  }
}

const stress = {
  while: ({ stats, startTime, stressLimit }) => {
    return process.hrtime(startTime)[0] < stressLimit
  }
}

const counts = [1, 100, 1000, 10000]
let benchmarks = []
for (const count of counts) {
  const c = { count }
  if (count < 1000) benchmarks.push({ name: `fromMultihash-${count}-baseline`, ...base, ...c, ...baseline })
  benchmarks.push({ name: `fromMultihash-${count}-stress`, ...base, ...c, ...stress })
}

module.exports = benchmarks
