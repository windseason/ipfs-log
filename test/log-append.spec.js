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

let ipfs, testIdentity

Object.keys(testAPIs).forEach((IPFS) => {
  describe('Log - Append (' + IPFS + ')', function () {
    this.timeout(config.timeout)

    const keystore = Keystore.create(config.testKeysPath)
    const identitySignerFn = async (id, data) => {
      const key = await keystore.getKey(id)
      return keystore.sign(key, data)
    }
    const testACL = new AccessController()

    before(async () => {
      rmrf.sync(config.defaultIpfsConfig.repo)
      testIdentity = await IdentityProvider.createIdentity(keystore, 'userA', identitySignerFn)
      ipfs = await startIpfs(IPFS, config.defaultIpfsConfig)
    })

    after(async () => {
      await stopIpfs(ipfs)
      rmrf.sync(config.defaultIpfsConfig.repo)
    })

    describe('append', () => {
      describe('append one', async () => {
        let log

        before(async () => {
          log = new Log(ipfs, testACL, testIdentity, 'A')
          await log.append('hello1')
        })

        it('added the correct amount of items', () => {
          assert.strictEqual(log.length, 1)
        })

        it('added the correct values', async () => {
          log.values.forEach((entry) => {
            assert.strictEqual(entry.payload, 'hello1')
          })
        })

        it('added the correct amount of next pointers', async () => {
          log.values.forEach((entry) => {
            assert.strictEqual(entry.next.length, 0)
          })
        })

        it('has the correct heads', async () => {
          log.heads.forEach((head) => {
            assert.strictEqual(head.hash, log.values[0].hash)
          })
        })

        it('updated the clocks correctly', async () => {
          log.values.forEach((entry) => {
            assert.strictEqual(entry.clock.id, testIdentity.publicKey)
            assert.strictEqual(entry.clock.time, 1)
          })
        })
      })

      describe('append 100 items to a log', async () => {
        const amount = 100
        const nextPointerAmount = 64

        let log

        before(async () => {
          log = new Log(ipfs, testACL, testIdentity, 'A')
          for (let i = 0; i < amount; i++) {
            await log.append('hello' + i, nextPointerAmount)
            // Make sure the log has the right heads after each append
            const values = log.values
            assert.strictEqual(log.heads.length, 1)
            assert.strictEqual(log.heads[0].hash, values[values.length - 1].hash)
          }
        })

        it('added the correct amount of items', () => {
          assert.strictEqual(log.length, amount)
        })

        it('added the correct values', async () => {
          log.values.forEach((entry, index) => {
            assert.strictEqual(entry.payload, 'hello' + index)
          })
        })

        it('updated the clocks correctly', async () => {
          log.values.forEach((entry, index) => {
            assert.strictEqual(entry.clock.time, index + 1)
            assert.strictEqual(entry.clock.id, testIdentity.publicKey)
          })
        })

        it('added the correct amount of next pointers', async () => {
          log.values.forEach((entry, index) => {
            assert.strictEqual(entry.next.length, Math.min(index, nextPointerAmount))
          })
        })
      })
    })
  })
})
