'use strict'

const assert = require('assert')
const rmrf = require('rimraf')
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

let ipfs, testIdentity

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
      ipfs = await startIpfs(IPFS, ipfsConfig)
    })

    after(async () => {
      await stopIpfs(ipfs)
      rmrf.sync(ipfsConfig.repo)
    })

    describe('Basic iterator functionality', () => {
      let log1

      beforeEach(async () => {
        log1 = new Log(ipfs, testACL, testIdentity, { logId: 'X' })

        for (let i = 0; i <= 100; i++) {
          await log1.append('entry' + i)
        }
      })

      it('returns a Symbol.iterator object', async () => {
        let it = log1.iterator({
          gte: 'zdpuApFd5XAPkCTmSx7qWQmQzvtdJPtx2K5p9to6ytCS79bfk',
          amount: 0
        })

        assert.strictEqual(typeof it[Symbol.iterator], 'function')
        assert.deepStrictEqual(it.next(), { value: null, done: true })
      })

      it('iterates with lte and explicit amount', async () => {
        let amount = 10

        let it = log1.iterator({
          lte: 'zdpuAx5FC3cgoQSW7oXpBw6x4YiuDuaF9BBgncguzvndP8tDL',
          amount: amount
        })

        assert.strictEqual([...it].length, 10)

        let i = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (67 - i++))
        }
      })

      it('iterates with lt and explicit amount', async () => {
        let amount = 10

        let it = log1.iterator({
          lt: 'zdpuAx5FC3cgoQSW7oXpBw6x4YiuDuaF9BBgncguzvndP8tDL',
          amount: amount
        })

        let i = 1
        let count = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (67 - i++))
          count++
        }
        assert.strictEqual(count, amount)
      })

      it('iterates with gt and explicit amount', async () => {
        let amount = 5

        let it = log1.iterator({
          gt: 'zdpuAx5FC3cgoQSW7oXpBw6x4YiuDuaF9BBgncguzvndP8tDL',
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

      it('iterates with gte and explicit amount', async () => {
        let amount = 12

        let it = log1.iterator({
          gt: 'zdpuAx5FC3cgoQSW7oXpBw6x4YiuDuaF9BBgncguzvndP8tDL',
          amount: amount
        })

        let i = 0
        let count = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (79 - i++))
          count++
        }
        assert.strictEqual(count, amount)
      })

      /* eslint-disable camelcase */
      it('iterates with combinations of lt, gt, lte, and gte', async () => {
        // lt + gt
        let it_lt_gt = log1.iterator({
          gt: 'zdpuAvZ6cDrY57iDxEQ5iSXibAeJPcBFD1jHnAmKq1RUiyuoK',
          lt: 'zdpuAuPfNkZmPdMxbyw1MxEwuv3XdrMMtFaTSi7sgc7j8VnzW'
        })
        let it_lt_gt_array = [...it_lt_gt]

        // neither hash should appear in the array
        assert.strictEqual(it_lt_gt_array.map(e => e.hash)
          .indexOf('zdpuAvZ6cDrY57iDxEQ5iSXibAeJPcBFD1jHnAmKq1RUiyuoK'), -1)
        assert.strictEqual(it_lt_gt_array.map(e => e.hash)
          .indexOf('zdpuAuPfNkZmPdMxbyw1MxEwuv3XdrMMtFaTSi7sgc7j8VnzW'), -1)
        assert.strictEqual(it_lt_gt_array.length, 10)

        // lt + gte
        let it_lt_gte = log1.iterator({
          gte: 'zdpuAyw2rPe5ML6YmYe7DEyAq3CbWH3QpWQ4P6F4ZFroEebzz',
          lt: 'zdpuAxv8bUaFNmCp51zN3AwCLy83FfVCcp7GeTwCdtpVddziP'
        })
        let it_lt_gte_array = [...it_lt_gte]

        // neither hash should appear in the array
        assert.strictEqual(it_lt_gte_array.map(e => e.hash)
          .indexOf('zdpuAyw2rPe5ML6YmYe7DEyAq3CbWH3QpWQ4P6F4ZFroEebzz'), 24)
        assert.strictEqual(it_lt_gte_array.map(e => e.hash)
          .indexOf('zdpuAxv8bUaFNmCp51zN3AwCLy83FfVCcp7GeTwCdtpVddziP'), -1)
        assert.strictEqual(it_lt_gte_array.length, 25)

        // lte + gt
        let it_lte_gt = log1.iterator({
          gt: 'zdpuApQ4crttH3GmnVQPNdZ5UMNv3aCd3bcccFEKYCAdYUzir',
          lte: 'zdpuAxdV4PTwMZ4Ug2r9Y1Vi48EUJW4YZPnaWZW9kSfbR82SF'
        })
        let it_lte_gt_array = [...it_lte_gt]

        // neither hash should appear in the array
        assert.strictEqual(it_lte_gt_array.map(e => e.hash)
          .indexOf('zdpuApQ4crttH3GmnVQPNdZ5UMNv3aCd3bcccFEKYCAdYUzir'), -1)
        assert.strictEqual(it_lte_gt_array.map(e => e.hash)
          .indexOf('zdpuAxdV4PTwMZ4Ug2r9Y1Vi48EUJW4YZPnaWZW9kSfbR82SF'), 0)
        assert.strictEqual(it_lte_gt_array.length, 4)

        // lte + gte
        let it_lte_gte = log1.iterator({
          gte: 'zdpuAmAvVqqHiss5arZoY6oNDN6JRLVExfWyN48rxTrsscHaE',
          lte: 'zdpuApYv1r3kPGdSJoDYA8xkEAzKFK3bdvrdRX4jY13xZDpL6'
        })
        let it_lte_gte_array = [...it_lte_gte]

        // neither hash should appear in the array
        assert.strictEqual(it_lte_gte_array.map(e => e.hash)
          .indexOf('zdpuAmAvVqqHiss5arZoY6oNDN6JRLVExfWyN48rxTrsscHaE'), 9)
        assert.strictEqual(it_lte_gte_array.map(e => e.hash)
          .indexOf('zdpuApYv1r3kPGdSJoDYA8xkEAzKFK3bdvrdRX4jY13xZDpL6'), 0)
        assert.strictEqual(it_lte_gte_array.length, 10)
      })
      /* eslint-enable camelcase */

      it('iterates with gt and default amount value (full log)', async () => {
        let it = log1.iterator({
          gt: 'zdpuAx5FC3cgoQSW7oXpBw6x4YiuDuaF9BBgncguzvndP8tDL'
        })

        let i = 0
        let count = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (100 - i++))
          count++
        }
        assert.strictEqual(count, 33)
      })

      it('iterates with gte and default amount value (full log)', async () => {
        let it = log1.iterator({
          gte: 'zdpuAx5FC3cgoQSW7oXpBw6x4YiuDuaF9BBgncguzvndP8tDL'
        })

        let i = 0
        let count = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (100 - i++))
          count++
        }
        assert.strictEqual(count, 34)
      })

      it('iterates with lt and default amount value (full log)', async () => {
        let it = log1.iterator({
          lt: 'zdpuAx5FC3cgoQSW7oXpBw6x4YiuDuaF9BBgncguzvndP8tDL'
        })

        assert.strictEqual([...it].length, 67)

        let i = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (67 - i++))
        }
      })

      it('iterates with lte and default amount value (full log)', async () => {
        let it = log1.iterator({
          lte: 'zdpuAx5FC3cgoQSW7oXpBw6x4YiuDuaF9BBgncguzvndP8tDL'
        })

        assert.strictEqual([...it].length, 68)

        let i = 0
        for (let entry of it) {
          assert.strictEqual(entry.payload, 'entry' + (67 - i++))
        }
      })
    })
  })
})
