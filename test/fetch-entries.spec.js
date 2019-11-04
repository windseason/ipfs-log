'use strict'

const assert = require('assert')
const rmrf = require('rimraf')
const IPFSRepo = require('ipfs-repo')
const DatastoreLevel = require('datastore-level')
const Log = require('../src/log')
const EntryIO = require('../src/entry-io')
const IdentityProvider = require('orbit-db-identity-provider')
const Keystore = require('orbit-db-keystore')

// Test utils
const {
  config,
  testAPIs,
  startIpfs,
  stopIpfs
} = require('orbit-db-test-utils')

let ipfs, ipfsDaemon, testIdentity

const last = arr => arr[arr.length - 1]

Object.keys(testAPIs).forEach((IPFS) => {
  describe('Fetch entries', function() {
    this.timeout(config.timeout)

    const { identityKeyFixtures, signingKeyFixtures, identityKeysPath, signingKeysPath } = config
    const ipfsConfig = Object.assign({}, config.defaultIpfsConfig, {
      repo: config.defaultIpfsConfig.repo + '-log-append' + new Date().getTime()
    })

    let keystore, signingKeystore

    before(async () => {
      rmrf.sync(ipfsConfig.repo)
      rmrf.sync(identityKeysPath)
      rmrf.sync(signingKeysPath)

      keystore = new Keystore(identityKeysPath)
      signingKeystore = new Keystore(signingKeysPath)

      testIdentity = await IdentityProvider.createIdentity({ id: 'userA', keystore, signingKeystore })
      ipfs = await startIpfs(IPFS, ipfsConfig)
    })

    after(async () => {
      if (ipfs)
        await ipfs.stop()
      await keystore.close()
      await signingKeystore.close()
    })

    it('log with 10 entries', async () => {
      const count = 100
      let log = new Log(ipfs, testIdentity, 'X', )

      for (let i = 1; i < count + 1; i ++)
        await log.append('hello' + i, 8)

      const result = await EntryIO.fetchAll(ipfs, log.heads.map(e => e.hash), -1, [], 2000, () => {})
      assert.equal(result.length, count)
    })
  })
})
