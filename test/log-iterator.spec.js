'use strict'

const assert = require('assert')
const rmrf = require('rimraf')
const fs = require('fs-extra')
const Log = require('../src/log')
const IdentityProvider = require('orbit-db-identity-provider')
const LogCreator = require('./utils/log-creator')

// Test utils
const {
  config,
  testAPIs,
  startIpfs,
  stopIpfs
} = require('./utils')

let ipfs, testIdentity, testIdentity2, testIdentity3

Object.keys(testAPIs).forEach((IPFS) => {
  describe('Log - Iterator (' + IPFS + ')', function () {
    this.timeout(config.timeout)

    const { identityKeyFixtures, signingKeyFixtures, identityKeysPath, signingKeysPath } = config
    const ipfsConfig = Object.assign({}, config.defaultIpfsConfig, {
      repo: config.defaultIpfsConfig.repo + '-log-join' + new Date().getTime()
    })

    before(async () => {
      rmrf.sync(ipfsConfig.repo)
      rmrf.sync(identityKeysPath)
      rmrf.sync(signingKeysPath)
      await fs.copy(identityKeyFixtures, identityKeysPath)
      await fs.copy(signingKeyFixtures, signingKeysPath)
      testIdentity = await IdentityProvider.createIdentity({ id: 'userA', identityKeysPath, signingKeysPath })
      testIdentity2 = await IdentityProvider.createIdentity({ id: 'userB', identityKeysPath, signingKeysPath })
      testIdentity3 = await IdentityProvider.createIdentity({ id: 'userC', identityKeysPath, signingKeysPath })
      ipfs = await startIpfs(IPFS, ipfsConfig)
    })

    after(async () => {
      await stopIpfs(ipfs)
      rmrf.sync(ipfsConfig.repo)
      rmrf.sync(identityKeysPath)
      rmrf.sync(signingKeysPath)
    })

    describe('Basic iterator functionality', () => {
      let log1

      beforeEach(async () => {
        log1 = new Log(ipfs, testIdentity, { logId: 'X' })

        for (let i = 0; i <= 100; i++) {
          await log1.append('entry' + i)
        }
      })

      it('returns a Symbol.iterator object', async () => {
        let it = log1.iterator({
          lte: 'zdpuB3U4zsEJzqCXCvJsEiiKbzNeugrtuq5GTVndo2a5iPRLc',
          amount: 0
        })

        assert.strictEqual(typeof it[Symbol.iterator], 'function')
        assert.deepStrictEqual(it.next(), { value: undefined, done: true })
      })

      it('returns length with lte and amount', async () => {
        let amount = 10
        let it = log1.iterator({
          lte: 'zdpuAxtUhamjBAodvaxDaXBWcvM9yu55Q45PoMvLUSGPFyEuv',
          amount: amount
        })

        assert.strictEqual([...it].length, 10)
      })

      it('returns entries with lte and amount', async () => {
        let amount = 10

        let it = log1.iterator({
          lte: 'zdpuAxtUhamjBAodvaxDaXBWcvM9yu55Q45PoMvLUSGPFyEuv',
          amount: amount
        })

        let i = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (67 - i++))
        }
      })

      it('returns length with lt and amount', async () => {
        let amount = 10

        let it = log1.iterator({
          lt: 'zdpuAxtUhamjBAodvaxDaXBWcvM9yu55Q45PoMvLUSGPFyEuv',
          amount: amount
        })

        assert.strictEqual([...it].length, amount)
      })

      it('returns entries with lt and amount', async () => {
        let amount = 10

        let it = log1.iterator({
          lt: 'zdpuAxtUhamjBAodvaxDaXBWcvM9yu55Q45PoMvLUSGPFyEuv',
          amount: amount
        })

        let i = 1
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (67 - i++))
        }
      })

      it('returns correct length with gt and amount', async () => {
        let amount = 5
        let it = log1.iterator({
          gt: 'zdpuAxtUhamjBAodvaxDaXBWcvM9yu55Q45PoMvLUSGPFyEuv',
          amount: amount
        })

        let i = 0
        let count = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (72 - i++))
          count++
        }
        assert.strictEqual(count, amount)
      })

      it('returns length with gte and amount', async () => {
        let amount = 12

        let it = log1.iterator({
          gt: 'zdpuAxtUhamjBAodvaxDaXBWcvM9yu55Q45PoMvLUSGPFyEuv',
          amount: amount
        })

        assert.strictEqual([...it].length, amount)
      })

      it('returns entries with gte and amount', async () => {
        let amount = 12

        let it = log1.iterator({
          gt: 'zdpuAxtUhamjBAodvaxDaXBWcvM9yu55Q45PoMvLUSGPFyEuv',
          amount: amount
        })

        let i = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (79 - i++))
        }
      })

      /* eslint-disable camelcase */
      it('iterates with lt and gt', async () => {
        let it = log1.iterator({
          gt: 'zdpuAx3jLyGqFvUK25tzBJR5Kgwnhakr6jYeabakWmKcyFUzT',
          lt: 'zdpuAqFutHNmtL2qT9HHkP6HwJifCcmuTTVuje6pi6DUF5mVD'
        })
        let hashes = [...it].map(e => e.hash)

        // neither hash should appear in the array
        assert.strictEqual(hashes.indexOf('zdpuAx3jLyGqFvUK25tzBJR5Kgwnhakr6jYeabakWmKcyFUzT'), -1)
        assert.strictEqual(hashes.indexOf('zdpuAqFutHNmtL2qT9HHkP6HwJifCcmuTTVuje6pi6DUF5mVD'), -1)
        assert.strictEqual(hashes.length, 10)
      })

      it('iterates with lt and gte', async () => {
        let it = log1.iterator({
          gte: 'zdpuAqyCCtNbzhm27qmckquELV2LYg3pc8s4x4sm46NvGzcqB',
          lt: 'zdpuAtJ1w1UuTWMrGVoHXFQdVTs6bzvVsi2bVXi2eLUwb5H1B'
        })
        let hashes = [...it].map(e => e.hash)

        // only the gte hash should appear in the array
        assert.strictEqual(hashes.indexOf('zdpuAqyCCtNbzhm27qmckquELV2LYg3pc8s4x4sm46NvGzcqB'), 24)
        assert.strictEqual(hashes.indexOf('zdpuAtJ1w1UuTWMrGVoHXFQdVTs6bzvVsi2bVXi2eLUwb5H1B'), -1)
        assert.strictEqual(hashes.length, 25)
      })

      it('iterates with lte and gt', async () => {
        let it = log1.iterator({
          gt: 'zdpuB2dEHnduPD9tM55p8qHmgnvkxR4aQZag7pEtt4RcMzPK9',
          lte: 'zdpuB1aNsdg2R4yYqjBkm8zT2xRXb46cSMDpRVo8WUxpEYxWN'
        })
        let hashes = [...it].map(e => e.hash)

        // only the lte hash should appear in the array
        assert.strictEqual(hashes.indexOf('zdpuB2dEHnduPD9tM55p8qHmgnvkxR4aQZag7pEtt4RcMzPK9'), -1)
        assert.strictEqual(hashes.indexOf('zdpuB1aNsdg2R4yYqjBkm8zT2xRXb46cSMDpRVo8WUxpEYxWN'), 0)
        assert.strictEqual(hashes.length, 4)
      })

      it('iterates with lte and gte', async () => {
        let it = log1.iterator({
          gte: 'zdpuAxNS2DckLG7wgYY3ghzBbo8apcieDL2GNcd14wRqLQwRp',
          lte: 'zdpuAm6pQSw8Pn2U2DrfnkBEN4ereLczkKs5evZEVjG5wwx6u'
        })
        let hashes = [...it].map(e => e.hash)

        // neither hash should appear in the array
        assert.strictEqual(hashes.indexOf('zdpuAxNS2DckLG7wgYY3ghzBbo8apcieDL2GNcd14wRqLQwRp'), 9)
        assert.strictEqual(hashes.indexOf('zdpuAm6pQSw8Pn2U2DrfnkBEN4ereLczkKs5evZEVjG5wwx6u'), 0)
        assert.strictEqual(hashes.length, 10)
      })

      it('returns length with gt and default amount', async () => {
        let it = log1.iterator({
          gt: 'zdpuAxtUhamjBAodvaxDaXBWcvM9yu55Q45PoMvLUSGPFyEuv'
        })

        assert.strictEqual([...it].length, 33)
      })

      it('returns entries with gt and default amount', async () => {
        let it = log1.iterator({
          gt: 'zdpuAxtUhamjBAodvaxDaXBWcvM9yu55Q45PoMvLUSGPFyEuv'
        })

        let i = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (100 - i++))
        }
      })

      it('returns length with gte and default amount', async () => {
        let it = log1.iterator({
          gte: 'zdpuAxtUhamjBAodvaxDaXBWcvM9yu55Q45PoMvLUSGPFyEuv'
        })

        assert.strictEqual([...it].length, 34)
      })

      it('returns entries with gte and default amount', async () => {
        let it = log1.iterator({
          gte: 'zdpuAxtUhamjBAodvaxDaXBWcvM9yu55Q45PoMvLUSGPFyEuv'
        })

        let i = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (100 - i++))
        }
      })

      it('returns length with lt and default amount value', async () => {
        let it = log1.iterator({
          lt: 'zdpuAxtUhamjBAodvaxDaXBWcvM9yu55Q45PoMvLUSGPFyEuv'
        })

        assert.strictEqual([...it].length, 67)
      })

      it('returns entries with lt and default amount value', async () => {
        let it = log1.iterator({
          lt: 'zdpuAxtUhamjBAodvaxDaXBWcvM9yu55Q45PoMvLUSGPFyEuv'
        })

        let i = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (66 - i++))
        }
      })

      it('returns length with lte and default amount value', async () => {
        let it = log1.iterator({
          lte: 'zdpuAxtUhamjBAodvaxDaXBWcvM9yu55Q45PoMvLUSGPFyEuv'
        })

        assert.strictEqual([...it].length, 68)
      })

      it('returns entries with lte and default amount value', async () => {
        let it = log1.iterator({
          lte: 'zdpuAxtUhamjBAodvaxDaXBWcvM9yu55Q45PoMvLUSGPFyEuv'
        })

        let i = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (67 - i++))
        }
      })
    })

    describe('Iteration over forked/joined logs', () => {
      let fixture, identities

      before(async () => {
        identities = [testIdentity3, testIdentity2, testIdentity3, testIdentity]
        fixture = await LogCreator.createLogWithSixteenEntries(ipfs, identities)
      })

      it('returns the full length from all heads', async () => {
        let it = fixture.log.iterator({
          lte: fixture.log.heads
        })

        assert.strictEqual([...it].length, 16)
      })

      it('returns partial entries from all heads', async () => {
        let it = fixture.log.iterator({
          lte: fixture.log.heads,
          amount: 6
        })

        assert.deepStrictEqual([...it].map(e => e.payload),
          ['entryA10', 'entryA9', 'entryA8', 'entryA7', 'entryC0', 'entryA6'])
      })

      it('returns partial logs from single heads #1', async () => {
        let it = fixture.log.iterator({
          lte: [fixture.log.heads[0]]
        })

        assert.strictEqual([...it].length, 10)
      })

      it('returns partial logs from single heads #2', async () => {
        let it = fixture.log.iterator({
          lte: [fixture.log.heads[1]]
        })

        assert.strictEqual([...it].length, 11)
      })

      it('throws error if lt/lte not a string or array of entries', async () => {
        let errMsg

        try {
          fixture.log.iterator({
            lte: fixture.log.heads[1]
          })
        } catch (e) {
          errMsg = e.message
        }

        assert.strictEqual(errMsg, 'lt or lte must be a string or array of Entries')
      })
    })
  })
})
