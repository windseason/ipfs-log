'use strict';

const _       = require('lodash');
const Promise = require('bluebird');
const Lazy    = require('lazy.js');
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
      Promise.map(nexts, (f) => {
        let all = this.items.map((a) => a.hash);
        return this._fetchRecursive(this._ipfs, f, all, MaxHistory, 0).then((history) => {
          history.forEach((b) => this._insert(b));
          return history;
        });
      }, { concurrency: 1 }).then((r) => resolve(final));
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

        Promise.map(node.next, (f) => this._fetchRecursive(ipfs, f, all, amount, depth), { concurrency: 1 })
          .then((res) => {
            result = _.flatten(res.concat(result));
            resolve(result);
          });
      }).catch(reject);
    });
  }

  static create(ipfs, id, items) {
    if(!ipfs) throw new Error("Ipfs instance not defined")
    if(!id) throw new Error("id is not defined")
    return new Promise((resolve, reject) => {
      const list = new Log(ipfs, id, items);
      resolve(list);
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
          const log = Log.create(ipfs, json.id, items);
          resolve(log);
        }).catch(reject)
    });
  }

  static fromIpfsHash(ipfs, hash) {
    if(!ipfs) throw new Error("Ipfs instance not defined")
    if(!hash) throw new Error("Invalid hash: " + hash)
    return new Promise((resolve, reject) => {
      ipfs.object.get(hash)
        .then((res) => {
          const log = Log.fromJson(ipfs, JSON.parse(res.Data));
          resolve(log);
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
