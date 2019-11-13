'use strict'

const assert = require('assert')
const rmrf = require('rimraf')
const fs = require('fs-extra')
const Log = require('../src/log')
const IdentityProvider = require('orbit-db-identity-provider')
const Keystore = require('orbit-db-keystore')
const LogCreator = require('./utils/log-creator')

// Test utils
const {
  config,
  testAPIs,
  startIpfs,
  stopIpfs
} = require('orbit-db-test-utils')

let ipfs, testIdentity, testIdentity2, testIdentity3, identities

Object.keys(testAPIs).forEach((IPFS) => {
  describe('Log - Iterator (' + IPFS + ')', function () {
    this.timeout(config.timeout)

    const { identityKeyFixtures, signingKeyFixtures, identityKeysPath, signingKeysPath } = config
    const ipfsConfig = Object.assign({}, config.defaultIpfsConfig, {
      repo: config.defaultIpfsConfig.repo + '-log-join' + new Date().getTime()
    })

    let keystore, signingKeystore

    before(async () => {
      rmrf.sync(ipfsConfig.repo)
      rmrf.sync(identityKeysPath)
      rmrf.sync(signingKeysPath)
      await fs.copy(identityKeyFixtures, identityKeysPath)
      await fs.copy(signingKeyFixtures, signingKeysPath)

      keystore = new Keystore(identityKeysPath)
      signingKeystore = new Keystore(signingKeysPath)
      identities = new IdentityProvider({ keystore })
      testIdentity = await identities.createIdentity({ id: 'userA', signingKeystore })
      testIdentity2 = await identities.createIdentity({ id: 'userB', signingKeystore })
      testIdentity3 = await identities.createIdentity({ id: 'userC', signingKeystore })
      ipfs = await startIpfs(IPFS, ipfsConfig)
    })

    after(async () => {
      await stopIpfs(ipfs)
      rmrf.sync(ipfsConfig.repo)
      rmrf.sync(identityKeysPath)
      rmrf.sync(signingKeysPath)

      await keystore.close()
      await signingKeystore.close()
    })

    describe('Basic iterator functionality', () => {
      let log1

      beforeEach(async () => {
        log1 = new Log(ipfs, testIdentity, identities, { logId: 'X' })

        for (let i = 0; i <= 100; i++) {
          await log1.append('entry' + i)
        }
      })

      it('returns a Symbol.iterator object', async () => {
        let it = log1.iterator({
          lte: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA',
          amount: 0
        })

        assert.strictEqual(typeof it[Symbol.iterator], 'function')
        assert.deepStrictEqual(it.next(), { value: undefined, done: true })
      })

      it('returns length with lte and amount', async () => {
        let amount = 10
        let it = log1.iterator({
          lte: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA',
          amount: amount
        })

        assert.strictEqual([...it].length, 10)
      })

      it('returns entries with lte and amount', async () => {
        let amount = 10

        let it = log1.iterator({
          lte: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA',
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
          lt: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA',
          amount: amount
        })

        assert.strictEqual([...it].length, amount)
      })

      it('returns entries with lt and amount', async () => {
        let amount = 10

        let it = log1.iterator({
          lt: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA',
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
          gt: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA',
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
          gt: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA',
          amount: amount
        })

        assert.strictEqual([...it].length, amount)
      })

      it('returns entries with gte and amount', async () => {
        let amount = 12

        let it = log1.iterator({
          gt: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA',
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
          gt: 'zdpuAwsf1cGgwEmNDCnx89w2EkpsZ2evgEcRqMhmYzreRtQTB',
          lt: 'zdpuAqQU9u4zxCytL9jyJ1WG3CWHR5xPWjvZU4GQkgdgWVF9W'
        })
        let hashes = [...it].map(e => e.hash)

        // neither hash should appear in the array
        assert.strictEqual(hashes.indexOf('zdpuAwsf1cGgwEmNDCnx89w2EkpsZ2evgEcRqMhmYzreRtQTB'), -1)
        assert.strictEqual(hashes.indexOf('zdpuAqQU9u4zxCytL9jyJ1WG3CWHR5xPWjvZU4GQkgdgWVF9W'), -1)
        assert.strictEqual(hashes.length, 10)
      })

      it('iterates with lt and gte', async () => {
        let it = log1.iterator({
          gte: 'zdpuAySxcArbpCiibAEhtHvWS65W3irnmhSY16Z9BhzH7VQrL',
          lt: 'zdpuB3e6Tm74NveU81F9PQFFxvF7vFGvjJfYX25SCAiwnFLEV'
        })
        let hashes = [...it].map(e => e.hash)

        // only the gte hash should appear in the array
        assert.strictEqual(hashes.indexOf('zdpuAySxcArbpCiibAEhtHvWS65W3irnmhSY16Z9BhzH7VQrL'), 24)
        assert.strictEqual(hashes.indexOf('zdpuB3e6Tm74NveU81F9PQFFxvF7vFGvjJfYX25SCAiwnFLEV'), -1)
        assert.strictEqual(hashes.length, 25)
      })

      it('iterates with lte and gt', async () => {
        let it = log1.iterator({
          gt: 'zdpuB3LtZNtU8EitbGgKR8BGANsHqzjQqJumLrwToB1nNqrgA',
          lte: 'zdpuB2ssXMzz67i52AVtijKDv39CvMun31Kp7nZ38uNBT1Ky2'
        })
        let hashes = [...it].map(e => e.hash)

        // only the lte hash should appear in the array
        assert.strictEqual(hashes.indexOf('zdpuB3LtZNtU8EitbGgKR8BGANsHqzjQqJumLrwToB1nNqrgA'), -1)
        assert.strictEqual(hashes.indexOf('zdpuB2ssXMzz67i52AVtijKDv39CvMun31Kp7nZ38uNBT1Ky2'), 0)
        assert.strictEqual(hashes.length, 4)
      })

      it('iterates with lte and gte', async () => {
        let it = log1.iterator({
          gte: 'zdpuAuYTFopLYBKjV4zKf5w6GGcdG8nP6sj9a7reU1bM9vzVM',
          lte: 'zdpuAwj46ULAABam4b1W6JzacRj52uoXJ2Uqqs4T5oYq516SC'
        })
        let hashes = [...it].map(e => e.hash)

        // neither hash should appear in the array
        assert.strictEqual(hashes.indexOf('zdpuAuYTFopLYBKjV4zKf5w6GGcdG8nP6sj9a7reU1bM9vzVM'), 9)
        assert.strictEqual(hashes.indexOf('zdpuAwj46ULAABam4b1W6JzacRj52uoXJ2Uqqs4T5oYq516SC'), 0)
        assert.strictEqual(hashes.length, 10)
      })

      it('returns length with gt and default amount', async () => {
        let it = log1.iterator({
          gt: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA'
        })

        assert.strictEqual([...it].length, 33)
      })

      it('returns entries with gt and default amount', async () => {
        let it = log1.iterator({
          gt: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA'
        })

        let i = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (100 - i++))
        }
      })

      it('returns length with gte and default amount', async () => {
        let it = log1.iterator({
          gte: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA'
        })

        assert.strictEqual([...it].length, 34)
      })

      it('returns entries with gte and default amount', async () => {
        let it = log1.iterator({
          gte: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA'
        })

        let i = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (100 - i++))
        }
      })

      it('returns length with lt and default amount value', async () => {
        let it = log1.iterator({
          lt: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA'
        })

        assert.strictEqual([...it].length, 67)
      })

      it('returns entries with lt and default amount value', async () => {
        let it = log1.iterator({
          lt: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA'
        })

        let i = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (66 - i++))
        }
      })

      it('returns length with lte and default amount value', async () => {
        let it = log1.iterator({
          lte: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA'
        })

        assert.strictEqual([...it].length, 68)
      })

      it('returns entries with lte and default amount value', async () => {
        let it = log1.iterator({
          lte: 'zdpuAqfxFPuLbaJvP3occSPTNwTPLxj6SbtRbtE9tDzNzb5gA'
        })

        let i = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (67 - i++))
        }
      })
    })

    describe('Iteration over forked/joined logs', () => {
      let fixture, idList

      before(async () => {
        idList = [testIdentity3, testIdentity2, testIdentity3, testIdentity]
        fixture = await LogCreator.createLogWithSixteenEntries(Log, ipfs, idList, identities)
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
