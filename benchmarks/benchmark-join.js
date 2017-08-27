'use strict'

const Log = require('../src/log')
const IPFS = require('ipfs')
const IPFSRepo = require('ipfs-repo')
const DatastoreLevel = require('datastore-level')

// State
let ipfs
let log1, log2

// Metrics
let totalQueries = 0
let seconds = 0
let queriesPerSecond = 0
let lastTenSeconds = 0

const queryLoop = () => {
  const add1 = log1.append('a' + totalQueries)
  const add2 = log2.append('b' + totalQueries)

  Promise.all([add1, add2])
    .then((res) => {
      log1.join(res[1], 60)
      log2.join(res[0], 60)
      totalQueries++
      lastTenSeconds++
      queriesPerSecond++
      setImmediate(queryLoop)
    })
    .catch((e) => {
      console.error(e)
      process.exit(0)
    })
}

let run = (() => {
  console.log('Starting benchmark...')

  const repoConf = {
    storageBackends: {
      blocks: DatastoreLevel,
    },
  }

  ipfs = new IPFS({
    repo: new IPFSRepo('./ipfs-log-benchmarks/ipfs', repoConf),
    start: false,
    EXPERIMENTAL: {
      pubsub: true
    },
  })

  ipfs.on('error', (err) => {
    console.error(err)
    process.exit(1)
  })

  ipfs.on('ready', () => {
    log1 = new Log(ipfs, 'A')
    log2 = new Log(ipfs, 'B')

    // Output metrics at 1 second interval
    setInterval(() => {
      seconds++
      if (seconds % 10 === 0) {
        console.log(`--> Average of ${lastTenSeconds / 10} q/s in the last 10 seconds`)
        if (lastTenSeconds === 0) throw new Error('Problems!')
        lastTenSeconds = 0
      }
      console.log(`${queriesPerSecond} queries per second, ${totalQueries} queries in ${seconds} seconds. log1: ${log1.values.length}, log2: ${log2.values.length}`)
      queriesPerSecond = 0
    }, 1000)

    queryLoop()
  })
})()

module.exports = run
