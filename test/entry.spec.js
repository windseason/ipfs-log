'use strict';

const _      = require('lodash');
const assert = require('assert');
const async  = require('asyncawait/async');
const await  = require('asyncawait/await');
const Entry  = require('../src/entry');
const ipfsd  = require('ipfsd-ctl');

let ipfs, ipfsDaemon;
const IpfsApis = [{
  // js-ipfs
  start: () => {
    return new Promise((resolve, reject) => {
      const IPFS = require('ipfs')
      const ipfs = new IPFS();
      ipfs.goOnline(() => resolve(ipfs));
    });
  },
  stop: () => new Promise((resolve, reject) => ipfs.goOffline(resolve))
}, {
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
}];

IpfsApis.forEach(function(ipfsApi) {

  describe('Entry', function() {
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

    describe('create', () => {
      it('creates a an empty entry', async((done) => {
        const expectedHash = 'QmfAouPZ2Cu3Cjbjm63RVeWJt6L9QjTSyFLe9SK5dWXN1j';
        // console.log(ipfs)
        const entry = await(Entry.create(ipfs));
        assert.equal(entry.payload, null);
        assert.equal(entry.next.length, 0);
        assert.equal(entry.hash, expectedHash);
        done();
      }));

      it('creates a entry with payload', async((done) => {
        const expectedHash = 'QmP2wHv43QtH3aCj4pUXeoVmkdtqNBVtx5bfYyNSH6LmXG';
        const payload = 'hello world';
        const entry = await(Entry.create(ipfs, payload));
        assert.equal(entry.payload, payload);
        assert.equal(entry.next.length, 0);
        assert.equal(entry.hash, expectedHash);
        done();
      }));

      it('creates a entry with payload and next', async((done) => {
        const expectedHash = 'QmW94BLFbGNbaPjgGasX1rV9aYdE2qxnQnUBf9PbLkiBUo';
        const payload1 = 'hello world';
        const payload2 = 'hello again';
        const entry1 = await(Entry.create(ipfs, payload1));
        const entry2 = await(Entry.create(ipfs, payload2, entry1));
        assert.equal(entry2.payload, payload2);
        assert.equal(entry2.next.length, 1);
        assert.equal(entry2.hash, expectedHash);
        done();
      }));

      it('`next` parameter can be a string', async((done) => {
        const entry1 = await(Entry.create(ipfs, null));
        const entry2 = await(Entry.create(ipfs, null, entry1.hash));
        assert.equal(typeof entry2.next[0] === 'string', true);
        done();
      }));

      it('`next` parameter can be an instance of Entry', async((done) => {
        const entry1 = await(Entry.create(ipfs, null));
        const entry2 = await(Entry.create(ipfs, null, entry1));
        assert.equal(typeof entry2.next[0] === 'string', true);
        done();
      }));

      it('throws an error if ipfs is not defined', async((done) => {
        try {
          const entry = await(Entry.create());
        } catch(e) {
          assert.equal(e.message, 'Entry requires ipfs instance');
        }
        done();
      }));
    });

    describe('fromIpfsHash', () => {
      it('creates a entry from ipfs hash', async((done) => {
        const expectedHash = 'QmW94BLFbGNbaPjgGasX1rV9aYdE2qxnQnUBf9PbLkiBUo';
        const payload1 = 'hello world';
        const payload2 = 'hello again';
        const entry1 = await(Entry.create(ipfs, payload1));
        const entry2 = await(Entry.create(ipfs, payload2, entry1));
        const final = await(Entry.fromIpfsHash(ipfs, entry2.hash));
        assert.equal(final.payload, payload2);
        assert.equal(final.next.length, 1);
        assert.equal(final.next[0], entry1.hash);
        assert.equal(final.hash, expectedHash);
        done();
      }));

      it('throws an error if ipfs is not present', async((done) => {
        try {
          const entry = await(Entry.fromIpfsHash());
        } catch(e) {
          assert.equal(e.message, 'Entry requires ipfs instance');
        }
        done();
      }));

      it('throws an error if hash is undefined', async((done) => {
        try {
          const entry = await(Entry.fromIpfsHash(ipfs));
        } catch(e) {
          assert.equal(e.message, 'Invalid hash: undefined');
        }
        done();
      }));
    });

    describe('hasChild', () => {
      it('returns true if entry has a child', async((done) => {
        const payload1 = 'hello world';
        const payload2 = 'hello again';
        const entry1 = await(Entry.create(ipfs, payload1));
        const entry2 = await(Entry.create(ipfs, payload2, entry1));
        assert.equal(entry2.hasChild(entry1), true);
        done();
      }));

      it('returns false if entry does not have a child', async((done) => {
        const payload1 = 'hello world';
        const payload2 = 'hello again';
        const entry1 = await(Entry.create(ipfs, payload1));
        const entry2 = await(Entry.create(ipfs, payload2));
        const entry3 = await(Entry.create(ipfs, payload2, entry2));
        assert.equal(entry2.hasChild(entry1), false);
        assert.equal(entry3.hasChild(entry1), false);
        assert.equal(entry3.hasChild(entry2), true);
        done();
      }));
    });

    describe('getIpfsHash', () => {
      it('returns an ipfs hash', async((done) => {
        const expectedHash = 'QmfAouPZ2Cu3Cjbjm63RVeWJt6L9QjTSyFLe9SK5dWXN1j';
        const entry = await(Entry.create(ipfs));
        const hash = await(Entry.getIpfsHash(ipfs, entry));
        assert.equal(hash, expectedHash);
        done();
      }));
    });

    describe('asJson', () => {
      it('returns the entry as json with empty values', async((done) => {
        const payload = 'hello world';
        const entry = await(Entry.create(ipfs, payload));
        assert.notEqual(entry.asJson, null);
        assert.equal(entry.asJson.payload, payload);
        assert.equal(entry.asJson.next.length, 0);
        done();
      }));

      it('returns the entry as json with values', async((done) => {
        const payload = 'hello world';
        const entry1 = await(Entry.create(ipfs, payload));
        const entry2 = await(Entry.create(ipfs, payload, entry1));
        assert.equal(typeof entry2.next[0] === 'string', true);
        assert.notEqual(entry2.asJson, null);
        assert.equal(entry2.asJson.payload, payload);
        assert.equal(entry2.asJson.next.length, 1);
        assert.equal(entry2.asJson.next[0], entry1.hash);
        done();
      }));

      it('returns entry as json with values when next is a hash', async((done) => {
        const payload = 'hello world';
        const entry1 = await(Entry.create(ipfs, payload));
        const entry2 = await(Entry.create(ipfs, payload, [entry1.hash]));
        assert.equal(typeof entry2.next[0] === 'string', true);
        assert.notEqual(entry2.asJson, null);
        assert.equal(entry2.asJson.payload, payload);
        assert.equal(entry2.asJson.next.length, 1);
        assert.equal(entry2.asJson.next[0], entry1.hash);
        done();
      }));
    });

    describe('equals', () => {
      it('entrys are equal when the payload is the same', async((done) => {
        const payload = 'hello world 1';
        const entry1 = await(Entry.create(ipfs, payload));
        const entry2 = await(Entry.create(ipfs, payload));
        assert.equal(Entry.equals(entry1, entry2), true);
        done();
      }));

      it('entrys are not equal when the payload is different', async((done) => {
        const payload1 = 'hello world 1';
        const payload2 = 'hello world 2';
        const entry1 = await(Entry.create(ipfs, payload1));
        const entry2 = await(Entry.create(ipfs, payload2));
        assert.equal(Entry.equals(entry1, entry2), false);
        done();
      }));

      it('entrys are equal when next references and payloads are the same', async((done) => {
        const payload = 'hello world 1';
        const entry1 = await(Entry.create(ipfs, payload));
        const entry2 = await(Entry.create(ipfs, null, entry1));
        const entry3 = await(Entry.create(ipfs, null, entry1));
        assert.equal(Entry.equals(entry2, entry3), true);
        done();
      }));

      it('entrys are not equal when next references are not the same', async((done) => {
        const payload1 = 'hello world 1';
        const payload2 = 'hello world 2';
        const entry1 = await(Entry.create(ipfs, payload1));
        const entry2 = await(Entry.create(ipfs, payload2));
        const entry3 = await(Entry.create(ipfs, null, entry1));
        const entry4 = await(Entry.create(ipfs, null, entry2));
        assert.equal(Entry.equals(entry3, entry4), false);
        done();
      }));
    });
  });

});
