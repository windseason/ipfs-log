'use strict'

const assert = require('assert')
const rmrf = require('rimraf')
const Clock = require('../src/lamport-clock')
const Entry = require('../src/entry')
const Log = require('../src/log')
const AccessController = Log.AccessController
const IdentityProvider = require('orbit-db-identity-provider')

// Test utils
const {
  config,
  testAPIs,
  startIpfs,
  stopIpfs
} = require('./utils')

let ipfs, testIdentity, testIdentity2, testIdentity3, testIdentity4

const last = (arr) => {
  return arr[arr.length - 1]
}

Object.keys(testAPIs).forEach((IPFS) => {
  describe('Log - Iterator (' + IPFS + ')', function () {
    this.timeout(config.timeout)

    const testACL = new AccessController()
    const { identityKeysPath, signingKeysPath } = config
    const ipfsConfig = Object.assign({}, config.defaultIpfsConfig, {
      repo: config.defaultIpfsConfig.repo + '-log-join' + new Date().getTime()
    })

    before(async () => {
      rmrf.sync(ipfsConfig.repo)
      testIdentity = await IdentityProvider.createIdentity({ id: 'userA', identityKeysPath, signingKeysPath })
      testIdentity2 = await IdentityProvider.createIdentity({ id: 'userB', identityKeysPath, signingKeysPath })
      testIdentity3 = await IdentityProvider.createIdentity({ id: 'userC', identityKeysPath, signingKeysPath })
      testIdentity4 = await IdentityProvider.createIdentity({ id: 'userD', identityKeysPath, signingKeysPath })
      ipfs = await startIpfs(IPFS, ipfsConfig)
    })

    after(async () => {
      await stopIpfs(ipfs)
      rmrf.sync(ipfsConfig.repo)
    })

    describe('Basic iterator functionality', () => {
      let log1, log2, log3, log4

      beforeEach(async () => {
        log1 = new Log(ipfs, testACL, testIdentity, { logId: 'X' })
        log2 = new Log(ipfs, testACL, testIdentity2, { logId: 'X' })
        log3 = new Log(ipfs, testACL, testIdentity3, { logId: 'X' })
        log4 = new Log(ipfs, testACL, testIdentity4, { logId: 'X' })

        for (let i = 0; i <= 100; i++) {
          await log1.append('entry' + i)
        }
      })

      it('returns a Symbol.iterator object', async () => {
        let it = log1.iterator({
          gte: "zdpuApFd5XAPkCTmSx7qWQmQzvtdJPtx2K5p9to6ytCS79bfk",
          amount: 5
        })

        assert.equal(typeof it[Symbol.iterator], "function")
      })

      it.skip('iterates with gt and explicit amount', async () => { })

      it.skip('iterates with gte and explicit amount', async () => { })

      it.skip('iterates with lt and explicit amount', async () => { })

      it.skip('iterates with lte and explicit amount', async () => { })

      it.skip('iterates with combinations of lt, gt, lte, and gte', async () => { })

      it.skip('iterates with gt and default amount value (full log)', async () => { })

      it.skip('iterates with gte and default amount value (full log)', async () => { })

      it.skip('iterates with lt and default amount value (full log)', async () => { })

      it.skip('iterates with lte and default amount value (full log)', async () => { })
    })
  })
})
