'use strict'

const assert = require('assert')
const rmrf = require('rimraf')
const IPFSRepo = require('ipfs-repo')
const DatastoreLevel = require('datastore-level')
const Log = require('../src/log')
const EntryIO = require('../src/entry-io')

const apis = [require('ipfs')]

const dataDir = './ipfs/tests/fetch'

const repoConf = {
  storageBackends: {
    blocks: DatastoreLevel,
  },
}

let ipfs, ipfsDaemon

const last = arr => arr[arr.length - 1]

apis.forEach((IPFS) => {
  describe('Fetch entries', function() {
    this.timeout(20000)

    before((done) => {
      rmrf.sync(dataDir)
      ipfs = new IPFS({ 
        repo: new IPFSRepo(dataDir, repoConf),
        start: true,
        EXPERIMENTAL: {
          pubsub: true,
          dht: false,
          sharding: false,
        },
      })
      ipfs.on('error', done)
      ipfs.on('ready', () => done())
    })

    after(async () => {
      if (ipfs) 
        await ipfs.stop()
    })

    it('log with 10 entries', async () => {
      const count = 100
      let log = new Log(ipfs, 'X', )

      for (let i = 1; i < count + 1; i ++)
        await log.append('hello' + i, 8)

      const result = await EntryIO.fetchAll(ipfs, log.heads.map(e => e.hash), -1, [], 2000, () => {})
      assert.equal(result.length, count)
    })
  })
})
