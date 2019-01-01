const startIPFS = require('./utils/start-ipfs')
const releaseRepo = require('./utils/release-repo')
const createLog = require('./utils/create-log')
const Log = require('../src/log')

const base = {
  prepare: async function () {
    const { ipfs, repo } = await startIPFS('./ipfs-log-benchmarks/ipfs')
    const { log } = await createLog(ipfs, 'A')

    process.stdout.clearLine()
    for (let i = 1; i<this.count + 1; i++) {
      process.stdout.write(`\r${this.name} / Preparing / Writing: ${i}/${this.count}`)
      await log.append(`Hello World: ${i}`)
    }

    return { log, repo }
  },
  cycle: async function ({ log }) {
    return log.tailHashes
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
  while: (stats, startTime) => {
    return process.hrtime(startTime)[0] < 300
  }
}

const counts = [1, 100, 1000, 10000]
let benchmarks = []
for (const count of counts) {
  const c = { count }
  benchmarks.push({ name: `tailHashes-${count}-baseline`, ...base, ...c, ...baseline })
  benchmarks.push({ name: `tailHashes-${count}-stress`, ...base, ...c, ...stress })
}

module.exports = benchmarks
