const startIPFS = require('./utils/start-ipfs')
const releaseRepo = require('./utils/release-repo')
const createLog = require('./utils/create-log')

const base = {
  prepare: async function () {
    const { ipfs, repo } = await startIPFS('./ipfs-log-benchmarks/ipfs')
    const { log: logA } = await createLog(ipfs, 'A')
    const { log: logB } = await createLog(ipfs, 'B')
    return { logA, logB, repo }
  },
  cycle: async function ({ logA, logB }) {
    const add1 = await logA.append('Hello1')
    const add2 = await logB.append('Hello2')

    await Promise.all([add1, add2])
    logA.join(logB)
    logB.join(logA)
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

module.exports = [
  { name: 'join-baseline', ...base, ...baseline },
  { name: 'join-stress', ...base, ...stress }
]
