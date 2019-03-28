'use strict'

const assert = require('assert')
const rmrf = require('rimraf')

const Log = require('../src/log')
const IdentityProvider = require('orbit-db-identity-provider')

// Test utils
const { config, testAPIs, startIpfs, stopIpfs } = require('./utils')

let ipfs, testIdentity

const last = arr => {
  return arr[arr.length - 1]
}

Object.keys(testAPIs).forEach(IPFS => {
  describe('Log - Heads (' + IPFS + ')', function () {
    this.timeout(config.timeout)

    const { identityKeysPath, signingKeysPath } = config
    const ipfsConfig = Object.assign({}, config.defaultIpfsConfig, {
      repo: config.defaultIpfsConfig.repo + '-log-heads' + new Date().getTime()
    })

    before(async () => {
      rmrf.sync(ipfsConfig.repo)
      testIdentity = await IdentityProvider.createIdentity({
        id: 'userA',
        identityKeysPath,
        signingKeysPath
      })
      ipfs = await startIpfs(IPFS, ipfsConfig)
    })

    after(async () => {
      await stopIpfs(ipfs)
      rmrf.sync(ipfsConfig.repo)
    })

    describe('heads', () => {
      it('finds one head after one entry', async () => {
        let log1 = new Log(ipfs, testIdentity, { logId: 'A' })
        await log1.append('helloA1')
        const heads = await log1.heads
        assert.strictEqual(heads.length, 1)
      })

      it('finds one head after two entries', async () => {
        let log1 = new Log(ipfs, testIdentity, { logId: 'A' })
        await log1.append('helloA1')
        await log1.append('helloA2')
        const heads = await log1.heads
        assert.strictEqual(heads.length, 1)
      })

      it('log contains the head entry', async () => {
        let log1 = new Log(ipfs, testIdentity, { logId: 'A' })
        await log1.append('helloA1')
        await log1.append('helloA2')
        const heads = await log1.heads
        const expectedHead = await log1.get(heads[0].cid)
        assert.deepStrictEqual(expectedHead, heads[0])
      })

      it('finds head after a join and append', async () => {
        let log1 = new Log(ipfs, testIdentity, { logId: 'A' })
        let log2 = new Log(ipfs, testIdentity, { logId: 'A' })

        await log1.append('helloA1')
        await log1.append('helloA2')
        await log2.append('helloB1')

        await log2.join(log1)
        await log2.append('helloB2')

        const values = await log2.values
        const heads = await log2.heads

        const expectedHead = last(values)

        assert.strictEqual(heads.length, 1)
        assert.deepStrictEqual(heads[0].cid, expectedHead.cid)
      })

      it('finds two heads after a join', async () => {
        let log2 = new Log(ipfs, testIdentity, { logId: 'A' })
        let log1 = new Log(ipfs, testIdentity, { logId: 'A' })

        await log1.append('helloA1')
        await log1.append('helloA2')
        const values1 = await log1.values
        const expectedHead1 = last(values1)

        await log2.append('helloB1')
        await log2.append('helloB2')
        const values2 = await log2.values
        const expectedHead2 = last(values2)

        await log1.join(log2)

        const heads = await log1.heads
        assert.strictEqual(heads.length, 2)
        assert.strictEqual(heads[0].cid, expectedHead2.cid)
        assert.strictEqual(heads[1].cid, expectedHead1.cid)
      })

      it('finds two heads after two joins', async () => {
        let log1 = new Log(ipfs, testIdentity, { logId: 'A' })
        let log2 = new Log(ipfs, testIdentity, { logId: 'A' })

        await log1.append('helloA1')
        await log1.append('helloA2')

        await log2.append('helloB1')
        await log2.append('helloB2')

        await log1.join(log2)

        await log2.append('helloB3')

        await log1.append('helloA3')
        await log1.append('helloA4')
        const values1 = await log1.values
        const values2 = await log2.values
        const expectedHead1 = last(values1)
        const expectedHead2 = last(values2)

        await log1.join(log2)

        const heads = await log1.heads
        assert.strictEqual(heads.length, 2)
        assert.strictEqual(heads[0].cid, expectedHead1.cid)
        assert.strictEqual(heads[1].cid, expectedHead2.cid)
      })

      it('finds two heads after three joins', async () => {
        let log1 = new Log(ipfs, testIdentity, { logId: 'A' })
        let log2 = new Log(ipfs, testIdentity, { logId: 'A' })
        let log3 = new Log(ipfs, testIdentity, { logId: 'A' })

        await log1.append('helloA1')
        await log1.append('helloA2')
        await log2.append('helloB1')
        await log2.append('helloB2')
        await log1.join(log2)
        await log1.append('helloA3')
        await log1.append('helloA4')
        const values1 = await log1.values
        const expectedHead1 = last(values1)
        await log3.append('helloC1')
        await log3.append('helloC2')
        await log2.join(log3)
        await log2.append('helloB3')
        const values2 = await log2.values
        const expectedHead2 = last(values2)
        await log1.join(log2)

        const heads = await log1.heads
        assert.strictEqual(heads.length, 2)
        assert.strictEqual(heads[0].cid, expectedHead1.cid)
        assert.strictEqual(heads[1].cid, expectedHead2.cid)
      })

      it('finds three heads after three joins', async () => {
        let log1 = new Log(ipfs, testIdentity, { logId: 'A' })
        let log2 = new Log(ipfs, testIdentity, { logId: 'A' })
        let log3 = new Log(ipfs, testIdentity, { logId: 'A' })

        await log1.append('helloA1')
        await log1.append('helloA2')
        await log2.append('helloB1')
        await log2.append('helloB2')
        await log1.join(log2)
        await log1.append('helloA3')
        await log1.append('helloA4')
        const values1 = await log1.values
        const expectedHead1 = last(values1)
        await log3.append('helloC1')
        await log2.append('helloB3')
        await log3.append('helloC2')
        const values2 = await log2.values
        const values3 = await log3.values
        const expectedHead2 = last(values2)
        const expectedHead3 = last(values3)
        await log1.join(log2)
        await log1.join(log3)

        const heads = await log1.heads
        assert.strictEqual(heads.length, 3)
        assert.deepStrictEqual(heads[0].cid, expectedHead1.cid)
        assert.deepStrictEqual(heads[1].cid, expectedHead2.cid)
        assert.deepStrictEqual(heads[2].cid, expectedHead3.cid)
      })
    })
  })
})
