const startIPFS = require('./utils/start-ipfs')
const createLog = require('./utils/create-log')
const Log = require('../../../src/log')

const base = {
  prepare: async function () {
    const { ipfs, repo } = await startIPFS('./ipfs-log-benchmarks/ipfs')
    const { log } = await createLog(ipfs, 'A')

    process.stdout.clearLine()
    const entries = []
    for (let i = 1; i < this.count + 1; i++) {
      process.stdout.write(`\r${this.name} / Preparing / Writing: ${i}/${this.count}`)
      const entry = await log.append(`Hello World: ${i}`)
      entries.push(entry)
    }

    return { log, repo, entries }
  },
  cycle: async function ({ log, entries }) {
    return Log.findHeads(entries)
  },
  teardown: async function ({ repo }) {
    await repo.close()
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
const benchmarks = []
for (const count of counts) {
  const c = { count }
  benchmarks.push({ name: `findHeads-${count}-baseline`, ...base, ...c, ...baseline })
  benchmarks.push({ name: `findHeads-${count}-stress`, ...base, ...c, ...stress })
}

module.exports = benchmarks
