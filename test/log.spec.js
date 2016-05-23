'use strict';

const _      = require('lodash');
const assert = require('assert');
const async  = require('asyncawait/async');
const await  = require('asyncawait/await');
const Log    = require('../src/log');
const Entry  = require('../src/entry');
const ipfsd  = require('ipfsd-ctl');
const MemIpfs = require('./mem-ipfs');

let ipfs, ipfsDaemon;
const IpfsApis = [
{
  // mem-ipfs
  start: () => Promise.resolve(MemIpfs),
  stop: () => Promise.resolve()
},
{
  // js-ipfs
  start: () => {
    return new Promise((resolve, reject) => {
      const IPFS = require('ipfs')
      const ipfs = new IPFS();
      // ipfs.goOnline(() => resolve(ipfs));
      resolve(ipfs);
    });
  },
  stop: () => Promise.resolve()
  // stop: () => new Promise((resolve, reject) => ipfs.goOffline(resolve))
},
{
  // js-ipfs-api via local daemon
  start: () => {
    return new Promise((resolve, reject) => {
      ipfsd.disposableApi((err, ipfs) => {
        if(err) console.error(err);
        resolve(ipfs);
      });
      // ipfsd.local((err, node) => {
      //   if(err) reject(err);
      //   ipfsDaemon = node;
      //   ipfsDaemon.startDaemon((err, ipfs) => {
      //     if(err) reject(err);
      //     resolve(ipfs);
      //   });
      // });
    });
  },
  stop: () => Promise.resolve()
  // stop: () => new Promise((resolve, reject) => ipfsDaemon.stopDaemon(resolve))
}
];

IpfsApis.forEach(function(ipfsApi) {

  describe('Log', function() {
    this.timeout(40000);
    before(async((done) => {
      try {
        ipfs = await(ipfsApi.start());
      } catch(e) {
        console.log(e);
        assert.equal(e, null);
      }
      this.timeout(2000);
      done();
    }));

    after(async((done) => {
      await(ipfsApi.stop());
      done();
    }));

    describe('create', async(() => {
      it('creates an empty log', async((done) => {
        const log = new Log(ipfs, 'A');
        assert.equal(log.id, 'A');
        assert.equal(log._items instanceof Array, true);
        assert.equal(log._items.length, 0);
        assert.equal(log._currentBatch instanceof Array, true);
        assert.equal(log._currentBatch.length, 0);
        assert.equal(log._ipfs, ipfs);
        assert.equal(log.hash, null);
        done();
      }));

      it('throws an error if ipfs is not defined', async((done) => {
        try {
          const log = new Log();
        } catch(e) {
          assert.equal(e.message, 'Ipfs instance not defined');
        }
        done();
      }));

      it('throws an error if id is not defined', async((done) => {
        try {
          const log = new Log(ipfs);
        } catch(e) {
          assert.equal(e.message, 'id is not defined');
        }
        done();
      }));

      it('takes maxHistory as an option', async((done) => {
        const log = new Log(ipfs, 'A', 'db', { maxHistory: 100 });
        assert.equal(log.options.maxHistory, 100);
        done();
      }));

      it('sets maxHistory if not provided in options', async((done) => {
        const log = new Log(ipfs, 'A', 'db');
        assert.equal(log.options.maxHistory, 256);
        done();
      }));

      it('sets maxHistory if other options are provided', async((done) => {
        const log = new Log(ipfs, 'A', 'db', { hello: "world" });
        assert.equal(log.options.maxHistory, 256);
        done();
      }));

    }));

    describe('serialize', async(() => {
      let log;
      const expectedData = {
        id: "A",
        items: [
          'QmRMUN4WJdpYydRLpbipaNoLQNXiw9ifRpPht5APaLFqrR',
          'Qmcpgub1qRG5XHed1qNciwb74uasUhQVEhP35oaZZ7UWbi',
          'QmQM4Xg6EGGGEKRYu3jX3cpTcXK53XvSgQpxZd2qGY1L2V'
        ]
      };

      beforeEach(async((done) => {
        log = new Log(ipfs, 'A');
        await(log.add("one"));
        await(log.add("two"));
        await(log.add("three"));
        done();
      }));

      describe('snapshot', async(() => {
        it('returns the current batch of items', async((done) => {
          assert.equal(JSON.stringify(log.snapshot), JSON.stringify(expectedData));
          done();
        }));
      }));

      describe('fromSnapshot', () => {
        it('creates a log from a snapshot', async((done) => {
          const str = JSON.stringify(log.snapshot, null, 2)
          const res = await(Log.fromJson(ipfs, JSON.parse(str)));
          assert.equal(res.items.length, 3);
          assert.equal(res.items[0].hash, expectedData.items[0]);
          assert.equal(res.items[1].hash, expectedData.items[1]);
          assert.equal(res.items[2].hash, expectedData.items[2]);
          done();
        }));
      });

      describe('getIpfsHash', async(() => {
        it('returns the log as ipfs hash', async((done) => {
          const expectedHash = 'QmaRz4njJX2W8QYwWLa1jhEbYUdJhhqibsBbnRYuWgr1r7';
          const log = new Log(ipfs, 'A');
          const hash = await(Log.getIpfsHash(ipfs, log));
          assert.equal(hash, expectedHash);
          done();
        }));

        it('log serialized to ipfs contains the correct data', async((done) => {
          const expectedData = { id: "A", items: [] };
          // const expectedData = {
          //   Data: '{"id":"A","items":[]}',
          //   Links: [],
          //   "Hash":"QmaRz4njJX2W8QYwWLa1jhEbYUdJhhqibsBbnRYuWgr1r7",
          //   "Size":23
          // };
          const log = new Log(ipfs, 'A');
          const hash = await(Log.getIpfsHash(ipfs, log));
          const res = await(ipfs.object.get(hash, { enc: 'base58' }));
          const result = JSON.parse(res.toJSON().Data);
          // assert.equal(JSON.stringify(res.toJSON().Data), JSON.stringify(expectedData));
          assert.equal(result.id, expectedData.id);
          assert.equal(result.items.length, expectedData.items.length);
          done();
        }));

        it('throws an error if ipfs is not defined', async((done) => {
          try {
            const log = new Log(ipfs, 'A');
            const hash = await(Log.getIpfsHash(null, log));
          } catch(e) {
            assert.equal(e.message, 'Ipfs instance not defined');
          }
          done();
        }));
      }));

      describe('fromIpfsHash', async(() => {
        it('creates an empty log from ipfs hash', async((done) => {
          const expectedData = { id: "A", items: [] };
          const log = new Log(ipfs, 'A');
          const hash = await(Log.getIpfsHash(ipfs, log));
          const res = await(Log.fromIpfsHash(ipfs, hash));
          assert.equal(JSON.stringify(res.snapshot), JSON.stringify(expectedData));
          done();
        }));

        it('creates a log from ipfs hash', async((done) => {
          const hash = await(Log.getIpfsHash(ipfs, log));
          const res = await(Log.fromIpfsHash(ipfs, hash));
          assert.equal(res.items.length, 3);
          assert.equal(res.items[0].hash, expectedData.items[0]);
          assert.equal(res.items[1].hash, expectedData.items[1]);
          assert.equal(res.items[2].hash, expectedData.items[2]);
          done();
        }));
      }));
    }));

    describe('items', () => {
      it('returns all entrys in the log', async((done) => {
        const log = new Log(ipfs, 'A');
        let items = log.items;
        assert.equal(log.items instanceof Array, true);
        assert.equal(log.items.length, 0);
        await(log.add("hello1"));
        await(log.add("hello2"));
        await(log.add("hello3"));
        assert.equal(log.items instanceof Array, true);
        assert.equal(log.items.length, 3);
        assert.equal(log.items[0].payload, 'hello1');
        assert.equal(log.items[1].payload, 'hello2');
        assert.equal(log.items[2].payload, 'hello3');
        assert.equal(log._items.length, 0);
        assert.equal(log._currentBatch.length, 3);
        done();
      }));

      it('returns all entrys from current batch and all known entrys', async((done) => {
        const log = new Log(ipfs, 'A');
        let items = log.items;
        assert.equal(log.items instanceof Array, true);
        assert.equal(log.items.length, 0);
        await(log.add("hello1"));
        await(log.add("hello2"));
        log._commit();
        await(log.add("hello3"));

        assert.equal(log.items instanceof Array, true);
        assert.equal(log.items.length, 3);
        assert.equal(log.items[0].payload, 'hello1');
        assert.equal(log.items[1].payload, 'hello2');
        assert.equal(log.items[2].payload, 'hello3');
        assert.equal(log._items.length, 2);
        assert.equal(log._currentBatch.length, 1);
        done();
      }));
    });

    describe('add', () => {
      it('adds an item to an empty log', async((done) => {
        const log = new Log(ipfs, 'A');
        await(log.add("hello1"));
        const item = log.items[0];
        assert.equal(log.items.length, 1);
        assert.equal(log._currentBatch.length, 1);
        assert.equal(log._items.length, 0);
        assert.equal(item, log._currentBatch[0]);
        assert.equal(item.payload, 'hello1');
        done();
      }));

      it('adds 100 items to a log', async((done) => {
        const log = new Log(ipfs, 'A');
        const amount = 100;

        for(let i = 1; i <= amount; i ++) {
          await(log.add("hello" + i));
        }

        const last = _.last(log.items);
        assert.equal(log.items.length, amount);
        assert.equal(last.payload, 'hello' + amount);
        assert.notEqual(last.next.length, 0);

        done();
      }));

      it('commits the log after batch size was reached', async((done) => {
        const log = new Log(ipfs, 'A');

        for(let i = 1; i <= Log.batchSize; i ++) {
          await(log.add("hello" + i));
        }

        assert.equal(log.items.length, Log.batchSize);
        assert.equal(log._currentBatch.length, Log.batchSize);
        assert.equal(log._items.length, 0);

        const item = _.last(log.items);
        assert.equal(log.items.length, Log.batchSize);
        assert.equal(item.payload, 'hello' + Log.batchSize);
        assert.notEqual(item.next.length, 0);

        done();
      }));
    });

    describe('join', () => {
      let log1, log2, log3, log4;

      beforeEach(async((done) => {
        log1 = new Log(ipfs, 'A');
        log2 = new Log(ipfs, 'B');
        log3 = new Log(ipfs, 'C');
        log4 = new Log(ipfs, 'D');
        done();
      }));

      it('joins only unique items', async((done) => {
        await(log1.add("helloA1"));
        await(log1.add("helloA2"));
        await(log2.add("helloB1"));
        await(log2.add("helloB2"));
        await(log1.join(log2));
        await(log1.join(log2));

        assert.equal(log1.items.length, 4);
        assert.equal(log1.items[0].hash, 'QmUEH5SEuRZhZ7RETwEX2df2BtTR2xUYZR3qBrhjnxqocb');
        assert.equal(log1.items[1].hash, 'Qma1PaYbyW1rZA4npPnuJzA3ov5Je4N9cvAn2p6Ju1iPQS');
        assert.equal(log1.items[2].hash, 'QmdZwCR96sP61aaTbcLj9DXy9EaiMhTXLRrTxPSXpcZCct');
        assert.equal(log1.items[3].hash, 'QmR3jTmVNQGfq4m6sDk2koFHFkSRMxJqSjrTHU293yyWMv');

        const last = _.last(log1.items);
        assert.equal(last.next.length, 1);
        assert.equal(last.next[0], 'QmdZwCR96sP61aaTbcLj9DXy9EaiMhTXLRrTxPSXpcZCct');
        done();
      }));

      it('joins logs two ways', async((done) => {
        await(log1.add("helloA1"));
        await(log1.add("helloA2"));
        await(log2.add("helloB1"));
        await(log2.add("helloB2"));
        await(log1.join(log2));
        await(log2.join(log1));

        const lastItem1 = _.last(log1.items);
        assert.equal(log1._currentBatch.length, 0);
        assert.equal(log1._items.length, 4);
        assert.equal(lastItem1.payload, 'helloB2');

        const lastItem2 = _.last(log2.items);
        assert.equal(log2._currentBatch.length, 0);
        assert.equal(log2._items.length, 4);
        assert.equal(lastItem2.payload, 'helloA2');
        done();
      }));

      it('joins logs twice', async((done) => {
        await(log1.add("helloA1"));
        await(log2.add("helloB1"));
        await(log2.join(log1));
        await(log1.add("helloA2"));
        await(log2.add("helloB2"));
        await(log2.join(log1));

        const secondItem = log2.items[1];
        const lastItem = _.last(log2.items);

        assert.equal(log2._currentBatch.length, 0);
        assert.equal(log2._items.length, 4);
        assert.equal(secondItem.payload, 'helloA1');
        assert.equal(lastItem.payload, 'helloA2');
        done();
      }));

      it('joins 4 logs to one', async((done) => {
        await(log1.add("helloA1"));
        await(log1.add("helloA2"));
        await(log2.add("helloB1"));
        await(log2.add("helloB2"));
        await(log3.add("helloC1"));
        await(log3.add("helloC2"));
        await(log4.add("helloD1"));
        await(log4.add("helloD2"));
        await(log1.join(log2));
        await(log1.join(log3));
        await(log1.join(log4));

        const secondItem = log1.items[1];
        const lastItem = _.last(log1.items);

        assert.equal(log1._currentBatch.length, 0);
        assert.equal(log1._items.length, 8);
        assert.equal(secondItem.payload, 'helloA2');
        assert.equal(lastItem.payload, 'helloD2');
        done();
      }));

      it('joins logs from 4 logs', async((done) => {
        await(log1.add("helloA1"));
        await(log1.join(log2));
        await(log2.add("helloB1"));
        await(log2.join(log1));
        await(log1.add("helloA2"));
        await(log2.add("helloB2"));
        await(log1.join(log3));
        await(log3.join(log1));
        await(log3.add("helloC1"));
        await(log4.add("helloD1"));
        await(log3.add("helloC2"));
        await(log4.add("helloD2"));
        await(log1.join(log3));
        await(log1.join(log2));
        await(log4.join(log2));
        await(log4.join(log1));
        await(log4.join(log3));
        await(log4.add("helloD3"));
        await(log4.add("helloD4"));
        const secondItem = log4.items[1];
        const lastItem1 = _.last(log4._items);
        const lastItem2 = _.last(log4.items);
        assert.equal(log4._currentBatch.length, 2);
        assert.equal(log4._items.length, 8);
        assert.equal(secondItem.payload, 'helloD2');
        assert.equal(lastItem1.payload, 'helloC2');
        assert.equal(lastItem2.payload, 'helloD4');
        done();
      }));

      it('fetches items from history on join', async((done) => {
        const count = 32;
        for(let i = 1; i < count + 1; i ++) {
          await(log1.add("first " + i));
          await(log2.add("second " + i));
        }

        const hash1 = await(Log.getIpfsHash(ipfs, log1));
        const hash2 = await(Log.getIpfsHash(ipfs, log2));

        const other1 = await(Log.fromIpfsHash(ipfs, hash1));
        const other2 = await(Log.fromIpfsHash(ipfs, hash2));
        await(log3.join(other1));

        assert.equal(_.includes(log3.items.map((a) => a.hash), undefined), false);
        assert.equal(log3.items.length, count);
        assert.equal(log3.items[0].payload, "first 1");
        assert.equal(_.last(log3.items).payload, "first " + count);

        await(log3.join(other2));
        assert.equal(log3.items.length, count * 2);
        assert.equal(log3.items[0].payload, "second 1");
        assert.equal(_.last(log3.items).payload, "second " + count);
        done();
      }));

      it('orders fetched items correctly', async((done) => {
        const count = Log.batchSize * 3;
        for(let i = 1; i < (count * 2) + 1; i ++)
          await(log1.add("first " + i));

        const hash1 = await(Log.getIpfsHash(ipfs, log1));
        const other1 = await(Log.fromIpfsHash(ipfs, hash1));
        await(log3.join(other1));

        assert.equal(log3.items[0].payload, "first 1");
        assert.equal(log3.items[log3.items.length - 1].payload, "first " + count * 2);
        assert.equal(log3.items.length, count * 2);

        // Second batch
        for(let i = 1; i < count + 1; i ++)
          await(log2.add("second " + i));

        const hash2 = await(Log.getIpfsHash(ipfs, log2));
        const other2 = await(Log.fromIpfsHash(ipfs, hash2));
        await(log3.join(other2));

        assert.equal(log3.items.length, count + count * 2);
        assert.equal(log3.items[0].payload, "second 1");
        assert.equal(log3.items[1].payload, "second 2");
        assert.equal(_.last(log3.items).payload, "second " + count);
        done();
      }));
    });

    describe('_fetchRecursive', () => {
      it('returns two items when neither are in the log', async((done) => {
        const log1 = new Log(ipfs, 'A');
        const entry1 = await(Entry.create(ipfs, 'one'))
        const entry2 = await(Entry.create(ipfs, 'two', entry1))
        const items = await(log1._fetchRecursive(ipfs, entry2.hash, [], 1000, 0));
        assert.equal(items.length, 2);
        assert.equal(items[0].hash, 'QmRMUN4WJdpYydRLpbipaNoLQNXiw9ifRpPht5APaLFqrR');
        assert.equal(items[1].hash, 'Qmcpgub1qRG5XHed1qNciwb74uasUhQVEhP35oaZZ7UWbi');
        done();
      }));

      it('returns three items when none are in the log', async((done) => {
        const log1 = new Log(ipfs, 'A');
        const entry1 = await(Entry.create(ipfs, 'one'))
        const entry2 = await(Entry.create(ipfs, 'two', entry1))
        const entry3 = await(Entry.create(ipfs, 'three', entry2))
        const items = await(log1._fetchRecursive(ipfs, entry3.hash, [], 1000, 0));
        assert.equal(items.length, 3);
        assert.equal(items[0].hash, 'QmRMUN4WJdpYydRLpbipaNoLQNXiw9ifRpPht5APaLFqrR');
        assert.equal(items[1].hash, 'Qmcpgub1qRG5XHed1qNciwb74uasUhQVEhP35oaZZ7UWbi');
        assert.equal(items[2].hash, 'QmQM4Xg6EGGGEKRYu3jX3cpTcXK53XvSgQpxZd2qGY1L2V');
        done();
      }));

      it('returns all items when none are in the log', async((done) => {
        const log1 = new Log(ipfs, 'A');
        let entrys = [];
        const amount = Log.batchSize * 4;
        for(let i = 1; i <= amount; i ++) {
          const prev = _.last(entrys);
          const n = await(Entry.create(ipfs, 'entry' + i, prev ? prev : null))
          entrys.push(n);
        }

        const items = await(log1._fetchRecursive(ipfs, _.last(entrys).hash, [], 1000, 0));
        assert.equal(items.length, amount);
        assert.equal(items[0].hash, entrys[0].hash);
        assert.equal(_.last(items).hash, _.last(entrys).hash);
        done();
      }));

      it('returns only the items that are not in the log', async((done) => {
        const log1 = new Log(ipfs, 'A');
        const entry1 = await(log1.add('one'))
        const entry2 = await(Entry.create(ipfs, 'two', entry1))
        const entry3 = await(Entry.create(ipfs, 'three', entry2))
        const allHashes = log1.items.map((a) => a.hash);
        const items = await(log1._fetchRecursive(ipfs, entry3.hash, allHashes, 1000, 0));
        assert.equal(items.length, 2);
        assert.equal(items[0].hash, 'Qmcpgub1qRG5XHed1qNciwb74uasUhQVEhP35oaZZ7UWbi');
        assert.equal(items[1].hash, 'QmQM4Xg6EGGGEKRYu3jX3cpTcXK53XvSgQpxZd2qGY1L2V');
        done();
      }));
    });

    describe('findHeads', () => {
      it('finds one head after one item', async((done) => {
        const log1 = new Log(ipfs, 'A');
        const log2 = new Log(ipfs, 'B');
        const log3 = new Log(ipfs, 'C');

        await(log1.add("helloA1"));

        // const heads = Log.findHeads(log1)
        const heads = log1._heads;
        assert.equal(heads.length, 1);
        assert.equal(heads[0], 'QmUEH5SEuRZhZ7RETwEX2df2BtTR2xUYZR3qBrhjnxqocb');
        done();
      }));

      it('finds one head after two items', async((done) => {
        const log1 = new Log(ipfs, 'A');
        const log2 = new Log(ipfs, 'B');
        const log3 = new Log(ipfs, 'C');

        await(log1.add("helloA1"));
        await(log1.add("helloA2"));

        // const heads = Log.findHeads(log1)
        const heads = log1._heads;
        assert.equal(heads.length, 1);
        assert.equal(heads[0], 'Qma1PaYbyW1rZA4npPnuJzA3ov5Je4N9cvAn2p6Ju1iPQS');
        done();
      }));

      it('finds two heads after a join', async((done) => {
        const log1 = new Log(ipfs, 'A');
        const log2 = new Log(ipfs, 'B');

        await(log1.add("helloA1"));
        const expectedHead1 = await(log1.add("helloA2"));

        await(log2.add("helloB1"));
        const expectedHead2 = await(log2.add("helloB2"));

        await(log1.join(log2));

        // const heads = Log.findHeads(log1)
        const heads = log1._heads;
        assert.equal(heads.length, 2);
        assert.equal(heads[0], expectedHead2.hash);
        assert.equal(heads[1], expectedHead1.hash);
        done();
      }));

      it('finds one head after two joins', async((done) => {
        const log1 = new Log(ipfs, 'A');
        const log2 = new Log(ipfs, 'B');

        await(log1.add("helloA1"));
        await(log1.add("helloA2"));
        await(log2.add("helloB1"));
        await(log2.add("helloB2"));
        await(log1.join(log2));
        await(log1.add("helloA3"));
        const expectedHead = await(log1.add("helloA4"));
        await(log1.join(log2));

        // const heads = Log.findHeads(log1)
        const heads = log1._heads;
        assert.equal(heads.length, 1);
        assert.equal(heads[0], expectedHead.hash);
        done();
      }));

      it('finds two heads after three joins', async((done) => {
        const log1 = new Log(ipfs, 'A');
        const log2 = new Log(ipfs, 'B');
        const log3 = new Log(ipfs, 'C');

        await(log1.add("helloA1"));
        await(log1.add("helloA2"));
        await(log2.add("helloB1"));
        await(log2.add("helloB2"));
        await(log1.join(log2));
        await(log1.add("helloA3"));
        const expectedHead1 = await(log1.add("helloA4"));
        await(log3.add("helloC1"));
        await(log3.add("helloC2"));
        await(log2.join(log3));
        const expectedHead2 = await(log2.add("helloB3"));
        await(log1.join(log2));

        // const heads = Log.findHeads(log1)
        const heads = log1._heads;
        assert.equal(heads.length, 2);
        assert.equal(heads[0], expectedHead2.hash);
        assert.equal(heads[1], expectedHead1.hash);
        done();
      }));

      it('finds three heads after three joins', async((done) => {
        const log1 = new Log(ipfs, 'A');
        const log2 = new Log(ipfs, 'B');
        const log3 = new Log(ipfs, 'C');

        await(log1.add("helloA1"));
        await(log1.add("helloA2"));
        await(log2.add("helloB1"));
        await(log2.add("helloB2"));
        await(log1.join(log2));
        await(log1.add("helloA3"));
        const expectedHead1 = await(log1.add("helloA4"));
        await(log3.add("helloC1"));
        const expectedHead2 = await(log2.add("helloB3"));
        const expectedHead3 = await(log3.add("helloC2"));
        await(log1.join(log2));
        await(log1.join(log3));

        // const heads = Log.findHeads(log1)
        const heads = log1._heads;
        assert.equal(heads.length, 3);
        assert.equal(heads[0], expectedHead3.hash);
        assert.equal(heads[1], expectedHead2.hash);
        assert.equal(heads[2], expectedHead1.hash);
        done();
      }));
    });

    describe('isReferencedInChain', () => {
      it('returns true if another entry in the log references the given entry', async((done) => {
        const log = new Log(ipfs, 'A');
        const entry1 = await(log.add('one'));
        const entry2 = await(log.add('two'));
        const res = Log.isReferencedInChain(log, entry1);
        assert.equal(res, true)
        done();
      }));

      it('returns false if no other entry in the log references the given entry', async((done) => {
        const log = new Log(ipfs, 'A');
        const entry1 = await(log.add('one'));
        const entry2 = await(log.add('two'));
        const res = Log.isReferencedInChain(log, entry2);
        assert.equal(res, false)
        done();
      }));
    });

    describe('_commit', () => {
      it('moves entrys from current batch to all known entrys', async((done) => {
        const log = new Log(ipfs, 'A');
        const entry1 = await(log.add('one'));
        const entry2 = await(log.add('two'));

        assert.equal(log._items.length, 0)
        assert.equal(log._currentBatch.length, 2)

        log._commit();

        assert.equal(log._items.length, 2)
        assert.equal(log._currentBatch.length, 0)
        done();
      }));
    });

    describe('_insert', () => {
      it('insert entry to the log before current batch if parent is in current bathc', async((done) => {
        const log = new Log(ipfs, 'A');
        const entry1 = await(log.add('one'));
        const entry2 = await(log.add('two'));
        const entry3 = await(Entry.create(ipfs, 'three', entry1))
        log._insert(entry3);
        assert.equal(log.items.length, 3)
        assert.equal(log.items[0].payload, 'three')
        assert.equal(log._items.length, 1)
        assert.equal(log._items[0].payload, 'three')
        done();
      }));

      it('insert to the log after the parent when parent is not in the current batch', async((done) => {
        const log = new Log(ipfs, 'A');
        const entry1 = await(log.add('one'));
        const entry2 = await(log.add('two'));
        const entry3 = await(Entry.create(ipfs, 'three', entry1))
        log._commit();
        log._insert(entry3);
        assert.equal(log.items.length, 3)
        assert.equal(log.items[1].payload, 'three')
        done();
      }));
    });

    describe('is a CRDT', () => {
      let log1, log2, log3;

      beforeEach(async((done) => {
        log1 = new Log(ipfs, 'A');
        log2 = new Log(ipfs, 'B');
        log3 = new Log(ipfs, 'C');
        done();
      }));

      it('join is associative', async((done) => {
        await(log1.add("helloA1"));
        await(log1.add("helloA2"));
        await(log2.add("helloB1"));
        await(log2.add("helloB2"));
        await(log3.add("helloC1"));
        await(log3.add("helloC2"));

        // a + (b + c)
        await(log2.join(log3));
        await(log1.join(log2));

        const res1 = log1.items.map((e) => e.hash).join(",");

        log1 = new Log(ipfs, 'A');
        log2 = new Log(ipfs, 'B');
        log3 = new Log(ipfs, 'C');
        await(log1.add("helloA1"));
        await(log1.add("helloA2"));
        await(log2.add("helloB1"));
        await(log2.add("helloB2"));
        await(log3.add("helloC1"));
        await(log3.add("helloC2"));

        // (a + b) + c
        await(log1.join(log2));
        await(log1.join(log3));

        const res2 = log1.items.map((e) => e.hash).join(",");

        // associativity: a + (b + c) == (a + b) + c
        const len = (46 + 1) * 6- 1; // 46 == ipfs hash, +1 == .join(","), * 4 == number of items, -1 == last item doesn't get a ',' from .join
        assert.equal(res1.length, len)
        assert.equal(res2.length, len)
        assert.equal(res1, res2);
        done();
      }));

      it('join is commutative', async((done) => {
        await(log1.add("helloA1"));
        await(log1.add("helloA2"));
        await(log2.join(log1));
        await(log2.add("helloB1"));
        await(log2.add("helloB2"));

        // b + a
        await(log2.join(log1));

        const res1 = log2.items.map((e) => e.hash).join(",");

        log1 = new Log(ipfs, 'A');
        log2 = new Log(ipfs, 'B');
        await(log1.add("helloA1"))
        await(log1.add("helloA2"))
        await(log2.join(log1))
        await(log2.add("helloB1"))
        await(log2.add("helloB2"))

        // a + b
        await(log1.join(log2));

        const res2 = log1.items.map((e) => e.hash).join(",");

        // commutativity: a + (b + c) == (a + b) + c
        const len = (46 + 1) * 4 - 1; // 46 == ipfs hash length, +1 == .join(","), * 4 == number of items, -1 == last item doesn't get a ',' from .join
        assert.equal(res1.length, len)
        assert.equal(res2.length, len)
        assert.equal(res1, res2);
        done();
      }));


      it('join is idempotent', async((done) => {
        await(log1.add("helloA1"));
        await(log1.add("helloA2"));
        await(log1.add("helloA3"));
        await(log2.add("helloA1"));
        await(log2.add("helloA2"));
        await(log2.add("helloA3"));

        // idempotence: a + a = a
        await(log1.join(log2));

        assert.equal(log1.id, 'A');
        assert.equal(log1.items.length, 3);
        done();
      }));
    });
  });

});
