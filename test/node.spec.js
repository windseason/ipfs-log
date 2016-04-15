'use strict';

const _      = require('lodash');
const assert = require('assert');
const async  = require('asyncawait/async');
const await  = require('asyncawait/await');
const ipfsd  = require('ipfsd-ctl');
const Node   = require('../src/node');

let ipfs;

const startIpfs = () => {
  return new Promise((resolve, reject) => {
    ipfsd.disposableApi((err, ipfs) => {
      if(err) console.error(err);
      resolve(ipfs);
    });
  });
};

describe('Node', function() {
  this.timeout(15000);
  before(async((done) => {
    try {
      ipfs = await(startIpfs());
    } catch(e) {
      console.log(e);
      assert.equals(e, null);
    }
    this.timeout(2000);
    done();
  }));

  describe('create', () => {
    it('creates a an empty node', async((done) => {
      const expectedHash = 'QmfAouPZ2Cu3Cjbjm63RVeWJt6L9QjTSyFLe9SK5dWXN1j';
      const node = await(Node.create(ipfs));
      assert.equal(node.payload, null);
      assert.equal(node.next.length, 0);
      assert.equal(node.hash, expectedHash);
      done();
    }));

    it('creates a node with payload', async((done) => {
      const expectedHash = 'QmP2wHv43QtH3aCj4pUXeoVmkdtqNBVtx5bfYyNSH6LmXG';
      const payload = 'hello world';
      const node = await(Node.create(ipfs, payload));
      assert.equal(node.payload, payload);
      assert.equal(node.next.length, 0);
      assert.equal(node.hash, expectedHash);
      done();
    }));

    it('creates a node with payload and next', async((done) => {
      const expectedHash = 'QmW94BLFbGNbaPjgGasX1rV9aYdE2qxnQnUBf9PbLkiBUo';
      const payload1 = 'hello world';
      const payload2 = 'hello again';
      const node1 = await(Node.create(ipfs, payload1));
      const node2 = await(Node.create(ipfs, payload2, node1));
      assert.equal(node2.payload, payload2);
      assert.equal(node2.next.length, 1);
      assert.equal(node2.hash, expectedHash);
      done();
    }));

    it('`next` parameter can be a string', async((done) => {
      const node1 = await(Node.create(ipfs, null));
      const node2 = await(Node.create(ipfs, null, node1.hash));
      assert.equal(typeof node2.next[0] === 'string', true);
      done();
    }));

    it('`next` parameter can be an instance of Node', async((done) => {
      const node1 = await(Node.create(ipfs, null));
      const node2 = await(Node.create(ipfs, null, node1));
      assert.equal(typeof node2.next[0] === 'string', true);
      done();
    }));

    it('throws an error if ipfs is not defined', async((done) => {
      try {
        const node = await(Node.create());
      } catch(e) {
        assert.equal(e.message, 'Node requires ipfs instance');
      }
      done();
    }));
  });

  describe('fromIpfsHash', () => {
    it('creates a node from ipfs hash', async((done) => {
      const expectedHash = 'QmW94BLFbGNbaPjgGasX1rV9aYdE2qxnQnUBf9PbLkiBUo';
      const payload1 = 'hello world';
      const payload2 = 'hello again';
      const node1 = await(Node.create(ipfs, payload1));
      const node2 = await(Node.create(ipfs, payload2, node1));
      const final = await(Node.fromIpfsHash(ipfs, node2.hash));
      assert.equal(final.payload, payload2);
      assert.equal(final.next.length, 1);
      assert.equal(final.next[0], node1.hash);
      assert.equal(final.hash, expectedHash);
      done();
    }));

    it('throws an error if ipfs is not present', async((done) => {
      try {
        const node = await(Node.fromIpfsHash());
      } catch(e) {
        assert.equal(e.message, 'Node requires ipfs instance');
      }
      done();
    }));

    it('throws an error if hash is undefined', async((done) => {
      try {
        const node = await(Node.fromIpfsHash(ipfs));
      } catch(e) {
        assert.equal(e.message, 'Invalid hash: undefined');
      }
      done();
    }));
  });

  describe('hasChild', () => {
    it('returns true if node has a child', async((done) => {
      const payload1 = 'hello world';
      const payload2 = 'hello again';
      const node1 = await(Node.create(ipfs, payload1));
      const node2 = await(Node.create(ipfs, payload2, node1));
      assert.equal(node2.hasChild(node1), true);
      done();
    }));

    it('returns false if node does not have a child', async((done) => {
      const payload1 = 'hello world';
      const payload2 = 'hello again';
      const node1 = await(Node.create(ipfs, payload1));
      const node2 = await(Node.create(ipfs, payload2));
      const node3 = await(Node.create(ipfs, payload2, node2));
      assert.equal(node2.hasChild(node1), false);
      assert.equal(node3.hasChild(node1), false);
      assert.equal(node3.hasChild(node2), true);
      done();
    }));
  });

  describe('getIpfsHash', () => {
    it('returns an ipfs hash', async((done) => {
      const expectedHash = 'QmfAouPZ2Cu3Cjbjm63RVeWJt6L9QjTSyFLe9SK5dWXN1j';
      const node = await(Node.create(ipfs));
      const hash = await(Node.getIpfsHash(ipfs, node));
      assert.equal(hash, expectedHash);
      done();
    }));
  });

  describe('asJson', () => {
    it('returns the node as json with empty values', async((done) => {
      const payload = 'hello world';
      const node = await(Node.create(ipfs, payload));
      assert.notEqual(node.asJson, null);
      assert.equal(node.asJson.payload, payload);
      assert.equal(node.asJson.next.length, 0);
      done();
    }));

    it('returns the node as json with values', async((done) => {
      const payload = 'hello world';
      const node1 = await(Node.create(ipfs, payload));
      const node2 = await(Node.create(ipfs, payload, node1));
      assert.equal(typeof node2.next[0] === 'string', true);
      assert.notEqual(node2.asJson, null);
      assert.equal(node2.asJson.payload, payload);
      assert.equal(node2.asJson.next.length, 1);
      assert.equal(node2.asJson.next[0], node1.hash);
      done();
    }));

    it('returns node as json with values when next is a hash', async((done) => {
      const payload = 'hello world';
      const node1 = await(Node.create(ipfs, payload));
      const node2 = await(Node.create(ipfs, payload, [node1.hash]));
      assert.equal(typeof node2.next[0] === 'string', true);
      assert.notEqual(node2.asJson, null);
      assert.equal(node2.asJson.payload, payload);
      assert.equal(node2.asJson.next.length, 1);
      assert.equal(node2.asJson.next[0], node1.hash);
      done();
    }));
  });

  describe('equals', () => {
    it('nodes are equal when the payload is the same', async((done) => {
      const payload = 'hello world 1';
      const node1 = await(Node.create(ipfs, payload));
      const node2 = await(Node.create(ipfs, payload));
      assert.equal(Node.equals(node1, node2), true);
      done();
    }));

    it('nodes are not equal when the payload is different', async((done) => {
      const payload1 = 'hello world 1';
      const payload2 = 'hello world 2';
      const node1 = await(Node.create(ipfs, payload1));
      const node2 = await(Node.create(ipfs, payload2));
      assert.equal(Node.equals(node1, node2), false);
      done();
    }));

    it('nodes are equal when next references and payloads are the same', async((done) => {
      const payload = 'hello world 1';
      const node1 = await(Node.create(ipfs, payload));
      const node2 = await(Node.create(ipfs, null, node1));
      const node3 = await(Node.create(ipfs, null, node1));
      assert.equal(Node.equals(node2, node3), true);
      done();
    }));

    it('nodes are not equal when next references are not the same', async((done) => {
      const payload1 = 'hello world 1';
      const payload2 = 'hello world 2';
      const node1 = await(Node.create(ipfs, payload1));
      const node2 = await(Node.create(ipfs, payload2));
      const node3 = await(Node.create(ipfs, null, node1));
      const node4 = await(Node.create(ipfs, null, node2));
      assert.equal(Node.equals(node3, node4), false);
      done();
    }));
  });
});
