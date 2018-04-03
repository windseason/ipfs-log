'use strict'

const Log = require('../src/log')
const EntryIO = require('../src/entry-io')
const IPFS = require('ipfs')
const IPFSRepo = require('ipfs-repo')
const DatastoreLevel = require('datastore-level')
const MemStore = require('../test/utils/mem-store')

// State
let ipfs
let log

// Metrics
let totalQueries = 0
let seconds = 0
let queriesPerSecond = 0
let lastTenSeconds = 0
let total = 0

let run = (() => {
  console.log('Starting benchmark...')

  const repoConf = {
    storageBackends: {
      blocks: DatastoreLevel,
    },
  }

  ipfs = new IPFS({
    repo: new IPFSRepo('./ipfs-log-benchmarks/fetch/ipfs', repoConf),
    start: false,
    EXPERIMENTAL: {
      pubsub: false,
      sharding: false,
      dht: false,
    },
  })

  ipfs.on('error', (err) => {
    console.error(err)
  })

  ipfs.on('ready', async () => {
    // Use memory store to test without disk IO
    const memstore = new MemStore()
    ipfs.object.put = memstore.put.bind(memstore)
    ipfs.object.get = memstore.get.bind(memstore)

    // Create a log
    log = new Log(ipfs, 'A')

    const count = parseInt(process.argv[2]) || 50000
    const refCount = 64
    const concurrency = 128
    const delay = 0

    console.log("Creating a log...")

    const st = new Date().getTime()

    for (let i = 1; i < count + 1; i ++) {
      await log.append('hello' + i, refCount)
      process.stdout.write("\rWriting " + i + " / " + count)
    }
    const dt1 = new Date().getTime()
    process.stdout.write(" (" + (dt1 - st) + " ms)\n")


    const onDataUpdated = (hash, entry, resultLength, result, queue) => {
      // totalQueries = resultLength
      queriesPerSecond++
      lastTenSeconds++
      total = resultLength
    }

    const outputMetrics = () => {
      // queriesPerSecond = total - queriesPerSecond
      totalQueries = total - totalQueries
      seconds++
      if (seconds % 10 === 0) {
        console.log(`--> Average of ${lastTenSeconds / 10} q/s in the last 10 seconds`)
        if (lastTenSeconds === 0) throw new Error('Problems!')
        lastTenSeconds = 0
      }
      console.log(`${queriesPerSecond} queries per second, ${totalQueries} queries in ${seconds} seconds (Entry count: ${total})`)
      queriesPerSecond = 0
    }

    // Output metrics at 1 second interval
    setInterval(outputMetrics, 1000)

    const dt2 = new Date().getTime()

    const result = await EntryIO.fetchAll(
      ipfs, 
      log.heads.map(e => e.hash), 
      -1, 
      [], 
      20000, 
      onDataUpdated, 
      null,
      concurrency,
      delay
    )

    // total = result.length
    // queriesPerSecond = result.length
    // queriesPerSecond = totalQueries - queriesPerSecond
    outputMetrics()
    const et = new Date().getTime()
    console.log("Loading took:", (et - dt2), "ms")
    process.exit(0)
  })
})()

module.exports = run
