const startIPFS = require('./utils/start-ipfs')
const releaseRepo = require('./utils/release-repo')
const createLog = require('./utils/create-log')

const base = {
  prepare: async function () {
    const { ipfs, repo } = await startIPFS('./ipfs-log-benchmarks/ipfs')
    const { log } = await createLog(ipfs, 'A')
    return { log, ipfs, repo }
  },
  cycle: async function ({ log }) {
    await log.append('Hello')
  },
  teardown: async function ({ repo }) {
    await releaseRepo(repo)
  }
}

const baseline = {
  while: (stats, startTime) => {
    return stats.count < 1000
  }
}

const stress = {
  while: (stats, startTime, limit) => {
    return process.hrtime(startTime)[0] < limit
  }
}

module.exports = [
  { name: 'append-baseline', ...base, ...baseline },
  { name: 'append-stress', ...base, ...stress }
]
