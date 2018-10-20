'use strict'

const assert = require('assert')
const rmrf = require('rimraf')
const Keystore = require('orbit-db-keystore')
const Log = require('../src/log')
const { AccessController, IdentityProvider } = Log

// Test utils
const {
  config,
  testAPIs,
  startIpfs,
  stopIpfs
} = require('./utils')

let ipfs, testIdentity, testIdentity2, testIdentity3

Object.keys(testAPIs).forEach((IPFS) => {
  describe('Log - CRDT (' + IPFS + ')', function () {
    this.timeout(config.timeout)

    const testACL = new AccessController()
    const keystore = Keystore.create(config.testKeysPath)
    const identitySignerFn = async (id, data) => {
      const key = await keystore.getKey(id)
      return keystore.sign(key, data)
    }
    const ipfsConfig = Object.assign({}, config.defaultIpfsConfig, {
      repo: config.defaultIpfsConfig.repo + '-log-crdt' + new Date().getTime()
    })

    before(async () => {
      rmrf.sync(ipfsConfig.repo)
      testIdentity = await IdentityProvider.createIdentity(keystore, 'userA', identitySignerFn)
      testIdentity2 = await IdentityProvider.createIdentity(keystore, 'userB', identitySignerFn)
      testIdentity3 = await IdentityProvider.createIdentity(keystore, 'userC', identitySignerFn)
      ipfs = await startIpfs(IPFS, ipfsConfig)
    })

    after(async () => {
      await stopIpfs(ipfs)
      rmrf.sync(ipfsConfig.repo)
    })

    describe('is a CRDT', () => {
      let log1, log2, log3

      beforeEach(async () => {
        log1 = new Log(ipfs, testACL, testIdentity, 'X')
        log2 = new Log(ipfs, testACL, testIdentity2, 'X')
        log3 = new Log(ipfs, testACL, testIdentity3, 'X')
      })

      it('join is associative', async () => {
        const expectedElementsCount = 6

        await log1.append('helloA1')
        await log1.append('helloA2')
        await log2.append('helloB1')
        await log2.append('helloB2')
        await log3.append('helloC1')
        await log3.append('helloC2')

        // a + (b + c)
        await log2.join(log3)
        await log1.join(log2)

        const res1 = log1.values.slice()

        log1 = new Log(ipfs, testACL, testIdentity, 'X')
        log2 = new Log(ipfs, testACL, testIdentity2, 'X')
        log3 = new Log(ipfs, testACL, testIdentity3, 'X')
        await log1.append('helloA1')
        await log1.append('helloA2')
        await log2.append('helloB1')
        await log2.append('helloB2')
        await log3.append('helloC1')
        await log3.append('helloC2')

        // (a + b) + c
        await log1.join(log2)
        await log3.join(log1)

        const res2 = log3.values.slice()

        // associativity: a + (b + c) == (a + b) + c
        assert.strictEqual(res1.length, expectedElementsCount)
        assert.strictEqual(res2.length, expectedElementsCount)
        assert.deepStrictEqual(res1, res2)
      })

      it('join is commutative', async () => {
        const expectedElementsCount = 4

        await log1.append('helloA1')
        await log1.append('helloA2')
        await log2.append('helloB1')
        await log2.append('helloB2')

        // b + a
        await log2.join(log1)
        const res1 = log2.values.slice()

        log1 = new Log(ipfs, testACL, testIdentity, 'X')
        log2 = new Log(ipfs, testACL, testIdentity2, 'X')
        await log1.append('helloA1')
        await log1.append('helloA2')
        await log2.append('helloB1')
        await log2.append('helloB2')

        // a + b
        await log1.join(log2)
        const res2 = log1.values.slice()

        // commutativity: a + b == b + a
        assert.strictEqual(res1.length, expectedElementsCount)
        assert.strictEqual(res2.length, expectedElementsCount)
        assert.deepStrictEqual(res1, res2)
      })

      it('multiple joins are commutative', async () => {
        // b + a == a + b
        log1 = new Log(ipfs, testACL, testIdentity, 'X')
        log2 = new Log(ipfs, testACL, testIdentity2, 'X')
        await log1.append('helloA1')
        await log1.append('helloA2')
        await log2.append('helloB1')
        await log2.append('helloB2')
        await log2.join(log1)
        const resA1 = log2.toString()

        log1 = new Log(ipfs, testACL, testIdentity, 'X')
        log2 = new Log(ipfs, testACL, testIdentity2, 'X')
        await log1.append('helloA1')
        await log1.append('helloA2')
        await log2.append('helloB1')
        await log2.append('helloB2')
        await log1.join(log2)
        const resA2 = log1.toString()

        assert.strictEqual(resA1, resA2)

        // a + b == b + a
        log1 = new Log(ipfs, testACL, testIdentity, 'X')
        log2 = new Log(ipfs, testACL, testIdentity2, 'X')
        await log1.append('helloA1')
        await log1.append('helloA2')
        await log2.append('helloB1')
        await log2.append('helloB2')
        await log1.join(log2)
        const resB1 = log1.toString()

        log1 = new Log(ipfs, testACL, testIdentity, 'X')
        log2 = new Log(ipfs, testACL, testIdentity2, 'X')
        await log1.append('helloA1')
        await log1.append('helloA2')
        await log2.append('helloB1')
        await log2.append('helloB2')
        await log2.join(log1)
        const resB2 = log2.toString()

        assert.strictEqual(resB1, resB2)

        // a + c == c + a
        log1 = new Log(ipfs, testACL, testIdentity, 'A')
        log3 = new Log(ipfs, testACL, testIdentity3, 'A')
        await log1.append('helloA1')
        await log1.append('helloA2')
        await log3.append('helloC1')
        await log3.append('helloC2')
        await log3.join(log1)
        const resC1 = log3.toString()

        log1 = new Log(ipfs, testACL, testIdentity, 'X')
        log3 = new Log(ipfs, testACL, testIdentity3, 'X')
        await log1.append('helloA1')
        await log1.append('helloA2')
        await log3.append('helloC1')
        await log3.append('helloC2')
        await log1.join(log3)
        const resC2 = log1.toString()

        assert.strictEqual(resC1, resC2)

        // c + b == b + c
        log2 = new Log(ipfs, testACL, testIdentity2, 'X')
        log3 = new Log(ipfs, testACL, testIdentity3, 'X')
        await log2.append('helloB1')
        await log2.append('helloB2')
        await log3.append('helloC1')
        await log3.append('helloC2')
        await log3.join(log2)
        const resD1 = log3.toString()

        log2 = new Log(ipfs, testACL, testIdentity2, 'X')
        log3 = new Log(ipfs, testACL, testIdentity3, 'X')
        await log2.append('helloB1')
        await log2.append('helloB2')
        await log3.append('helloC1')
        await log3.append('helloC2')
        await log2.join(log3)
        const resD2 = log2.toString()

        assert.strictEqual(resD1, resD2)

        // a + b + c == c + b + a
        log1 = new Log(ipfs, testACL, testIdentity, 'X')
        log2 = new Log(ipfs, testACL, testIdentity2, 'X')
        log3 = new Log(ipfs, testACL, testIdentity3, 'X')
        await log1.append('helloA1')
        await log1.append('helloA2')
        await log2.append('helloB1')
        await log2.append('helloB2')
        await log3.append('helloC1')
        await log3.append('helloC2')
        await log1.join(log2)
        await log1.join(log3)
        const logLeft = log1.toString()

        log1 = new Log(ipfs, testACL, testIdentity, 'X')
        log2 = new Log(ipfs, testACL, testIdentity2, 'X')
        log3 = new Log(ipfs, testACL, testIdentity3, 'X')
        await log1.append('helloA1')
        await log1.append('helloA2')
        await log2.append('helloB1')
        await log2.append('helloB2')
        await log3.append('helloC1')
        await log3.append('helloC2')
        await log3.join(log2)
        await log3.join(log1)
        const logRight = log3.toString()

        assert.strictEqual(logLeft, logRight)
      })

      it('join is idempotent', async () => {
        const expectedElementsCount = 3

        let logA = new Log(ipfs, testACL, testIdentity, 'X')
        await logA.append('helloA1')
        await logA.append('helloA2')
        await logA.append('helloA3')

        // idempotence: a + a = a
        await logA.join(logA)
        assert.strictEqual(logA.length, expectedElementsCount)
      })
    })
  })
})
