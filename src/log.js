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

    const heads = Log.findHeads(this);
    return Node.create(this._ipfs, data, heads)
      .then((node) => {
        this._currentBatch.push(node);
        return node;
      });
  }

  join(other) {
    const current = Lazy(this._currentBatch).difference(this._items).toArray();
    const diff    = _.differenceWith(other.items, current, Node.equals);
    const others  = _.differenceWith(other.items, this._items, Node.equals);
    const final   = _.unionWith(current, others, Node.equals);
    this._items   = this._items.concat(final);
    this._currentBatch = [];

    // Fetch history
    const nexts = _.flatten(other.items.map((f) => f.next));
    const promises = nexts.map((f) => {
      let all = this.items.map((a) => a.hash);
      return this._fetchRecursive(this._ipfs, f, all, MaxHistory, 0)
        .then((history) => {
          history.forEach((b) => this._insert(b));
          return history;
        });
    });
    return Promise.all(promises).then((r) => diff);
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
    let result = [];

    // If the given hash is in the given log (all) or if we're at maximum depth, return
    if(isReferenced(all, hash) || depth >= amount)
      return Promise.resolve(result);

    // Create the node and add it to the result
    return Node.fromIpfsHash(ipfs, hash).then((node) => {
      result.push(node);
      all.push(hash);
      depth ++;

      const promises = node.next.map((f) => this._fetchRecursive(ipfs, f, all, amount, depth));
      return Promise.all(promises).then((res) => _.flatten(res.concat(result)));
    });
  }

  static create(ipfs, id, items) {
    if(!ipfs) throw new Error("Ipfs instance not defined")
    if(!id) throw new Error("id is not defined")
    const log = new Log(ipfs, id, items);
    return Promise.resolve(log);
  }

  static getIpfsHash(ipfs, log) {
    if(!ipfs) throw new Error("Ipfs instance not defined")
    const data = new Buffer(JSON.stringify({ Data: JSON.stringify(log.snapshot) }));
    return ipfs.object.put(data)
      .then((res) => res.Hash)
  }

  static fromJson(ipfs, json) {
    return Promise.all(json.items.map((f) => Node.fromIpfsHash(ipfs, f)))
      .then((items) => Log.create(ipfs, json.id, items));
  }

  static fromIpfsHash(ipfs, hash) {
    if(!ipfs) throw new Error("Ipfs instance not defined")
    if(!hash) throw new Error("Invalid hash: " + hash)
    return ipfs.object.get(hash)
      .then((res) => Log.fromJson(ipfs, JSON.parse(res.Data)));
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
