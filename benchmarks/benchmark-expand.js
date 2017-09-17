'use strict'

const Log = require('../src/log')
const IPFS = require('ipfs')
const IPFSRepo = require('ipfs-repo')
const DatastoreLevel = require('datastore-level')
const pWhilst = require('p-whilst')

// State
let ipfs
let log

// Metrics
let totalQueries = 0
let seconds = 0
let queriesPerSecond = 0
let lastTenSeconds = 0

const logSize = 2000

const queryLoop = () => {
  const oldSize = log.length
  Log.expand(ipfs, log, 1)
    .then((res) => {
      log = res
      totalQueries++
      lastTenSeconds++
      queriesPerSecond++
      if (log.length > oldSize) {
        setImmediate(queryLoop)
      } else {
        console.log('Benchmark finished')
        process.exit(0)
      }
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
      pubsub: false,
      sharding: false,
      dht: false,
    },
  })

  ipfs.on('error', (err) => {
    console.error(err)
    process.exit(1)
  })

  ipfs.on('ready', () => {
    const reportMetrics = () => {
      // Output metrics at 1 second interval
      setInterval(() => {
        seconds++
        if (seconds % 10 === 0) {
          console.log(`--> Average of ${lastTenSeconds / 10} q/s in the last 10 seconds`)
          if (lastTenSeconds === 0) throw new Error('Problems!')
          lastTenSeconds = 0
        }
        console.log(`${queriesPerSecond} queries per second, ${totalQueries} queries in ${seconds} seconds. Log length: ${log.values.length}`)
        queriesPerSecond = 0
      }, 1000)
    }

    let values = []
    for (let i = 0; i < logSize; i++) {
      values.push(i)
    }

    let i = 0
    console.log('Generating a log')
    log = new Log(ipfs, 'A')
    pWhilst(
      () => i < logSize,
      () => {
        return log.append('a' + i)
          .then(() => {
            i++
          })
      }
    )
    .then(() => {
      const last = [log.values[log.values.length - 1]]
      Log.fromEntry(ipfs, last, 1)
        .then((res) => {
          log = res
          console.log('Log generated, starting benchmark')
          reportMetrics()
          queryLoop()
        })
    })
    .catch(e => console.error(e))
  })
})()

module.exports = run
