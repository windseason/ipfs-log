'use strict';

const _       = require('lodash');
const Lazy    = require('lazy.js');
const Buffer  = require('buffer').Buffer
const Node    = require('./node');

const MaxBatchSize = 10;  // How many items to keep per local batch
const MaxHistory   = 256; // How many items to fetch on join

class Log {
  constructor(ipfs, id, items) {
    this.id = id;
    this._ipfs = ipfs;
    this._items = items || [];
    this._currentBatch = [];
  }

  get items() {
    return this._items.concat(this._currentBatch);
  }

  get snapshot() {
    return {
      id: this.id,
      items: this._currentBatch.map((f) => f.hash)
    }
  }

  add(data) {
    if(this._currentBatch.length >= MaxBatchSize)
      this._commit();

    return new Promise((resolve, reject) => {
      const heads = Log.findHeads(this);
      Node.create(this._ipfs, data, heads)
        .then((node) => {
          this._currentBatch.push(node);
          resolve(node);
        }).catch(reject);
    });
  }

  join(other) {
    return new Promise((resolve, reject) => {
      const current = Lazy(this._currentBatch).difference(this._items).toArray();
      const others  = _.differenceWith(other.items, this._items, Node.equals);
      const final   = _.unionWith(current, others, Node.equals);
      this._items   = this._items.concat(final);
      this._currentBatch = [];

      // Fetch history
      const nexts = _.flatten(other.items.map((f) => f.next));
      const promises = nexts.map((f) => {
        let all = this.items.map((a) => a.hash);
        return this._fetchRecursive(this._ipfs, f, all, MaxHistory, 0).then((history) => {
          history.forEach((b) => this._insert(b));
          return history;
        });
      });
      Promise.all(promises).then((r) => resolve(this));
    });
  }

  clear() {
    this._items = [];
    this._currentBatch = [];
  }

  _insert(node) {
    let indices = Lazy(node.next).map((next) => Lazy(this._items).map((f) => f.hash).indexOf(next)) // Find the item's parent's indices
    const index = indices.toArray().length > 0 ? Math.max(indices.max() + 1, 0) : 0; // find the largest index (latest parent)
    this._items.splice(index, 0, node);
    return node;
  }

  _commit() {
    const current = Lazy(this._currentBatch).difference(this._items).toArray();
    this._items = this._items.concat(current);
    this._currentBatch = [];
  }

  _fetchRecursive(ipfs, hash, all, amount, depth) {
    const isReferenced = (list, item) => Lazy(list).reverse().find((f) => f === item) !== undefined;
    return new Promise((resolve, reject) => {
      let result = [];

      // If the given hash is in the given log (all) or if we're at maximum depth, return
      if(isReferenced(all, hash) || depth >= amount) {
        resolve(result)
        return;
      }

      // Create the node and add it to the result
      Node.fromIpfsHash(ipfs, hash).then((node) => {
        result.push(node);
        all.push(hash);
        depth ++;

        const promises = node.next.map((f) => this._fetchRecursive(ipfs, f, all, amount, depth));
        Promise.all(promises).then((res) => {
          result = _.flatten(res.concat(result));
          resolve(result);
        }).catch(reject);
      }).catch(reject);
    });
  }

  static create(ipfs, id, items) {
    if(!ipfs) throw new Error("Ipfs instance not defined")
    if(!id) throw new Error("id is not defined")
    return new Promise((resolve, reject) => {
      const log = new Log(ipfs, id, items);
      resolve(log);
    });
  }

  static getIpfsHash(ipfs, log) {
    if(!ipfs) throw new Error("Ipfs instance not defined")
    return new Promise((resolve, reject) => {
      ipfs.object.put(new Buffer(JSON.stringify({ Data: JSON.stringify(log.snapshot) })))
        .then((res) => resolve(res.Hash))
        .catch(reject);
    });
  }

  static fromJson(ipfs, json) {
    return new Promise((resolve, reject) => {
      Promise.all(json.items.map((f) => Node.fromIpfsHash(ipfs, f)))
        .then((items) => {
          Log.create(ipfs, json.id, items).then(resolve).catch(reject);
        }).catch(reject)
    });
  }

  static fromIpfsHash(ipfs, hash) {
    if(!ipfs) throw new Error("Ipfs instance not defined")
    if(!hash) throw new Error("Invalid hash: " + hash)
    return new Promise((resolve, reject) => {
      ipfs.object.get(hash)
        .then((res) => {
          Log.fromJson(ipfs, JSON.parse(res.Data)).then(resolve).catch(reject);
        }).catch(reject);
    });
  }

  static findHeads(log) {
    return Lazy(log.items)
      .reverse()
      .filter((f) => !Log.isReferencedInChain(log, f))
      .map((f) => f.hash)
      .toArray();
  }

  static isReferencedInChain(log, item) {
    return Lazy(log.items).reverse().find((e) => e.hasChild(item)) !== undefined;
  }

  static get batchSize() {
    return MaxBatchSize;
  }

  static get maxHistory() {
    return MaxHistory;
  }

}

module.exports = Log;
