'use strict';

const _            = require('lodash');
const Lazy         = require('lazy.js');
const Buffer       = require('buffer').Buffer
const EventEmitter = require('events').EventEmitter;
const Node         = require('./node');
const Promise = require('bluebird');

const MaxBatchSize = 10;  // How many items to keep per local batch
const MaxHistory   = 256; // How many items to fetch on join

class Log {
  constructor(ipfs, id, name, opts) {
    this.id = id;
    this.name = name;
    this._ipfs = ipfs;
    this._items = opts && opts.items ? opts.items : [];
    this.options = opts || { maxHistory: MaxHistory };
    if(!this.options.maxHistory) this.options.maxHistory = MaxHistory;
    this._currentBatch = [];
    this._heads = [];
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

    return Node.create(this._ipfs, data, this._heads)
      .then((node) => {
        this._heads = [node.hash];
        this._currentBatch[this._currentBatch.length] = node;
        return node;
      });
  }

  join(other) {
    const diff   = _.differenceWith(other.items, this._currentBatch, Node.equals);
    const others = _.differenceWith(other.items, this._items, Node.equals);
    const final  = _.unionWith(this._currentBatch, others, Node.equals);
    this._items  = this._items.concat(final);
    this._currentBatch = [];

    // Fetch history
    const nexts = _.flatten(other.items.map((f) => f.next));
    return Promise.map(nexts, (f) => {
      let all = this.items.map((a) => a.hash);
      return this._fetchRecursive(this._ipfs, f, all, this.options.maxHistory, 0)
        .then((history) => {
          let h = _.differenceWith(history, this._items, Node.equals);
          h.forEach((b) => this._insert(b));
          return h;
        });
    }, { concurrency: 1 }).then((r) => {
      this._heads = Log.findHeads(this);
      return _.flatten(r).concat(diff)
    })
  }

  clear() {
    this._items = [];
    this._currentBatch = [];
  }

  // Returns entries after initialization
  load() {
    return Promise.resolve([]);
  }

  _insert(node) {
    let indices = Lazy(node.next).map((next) => Lazy(this._items).map((f) => f.hash).indexOf(next)) // Find the item's parent's indices
    const index = indices.toArray().length > 0 ? Math.max(indices.max() + 1, 0) : 0; // find the largest index (latest parent)
    this._items.splice(index, 0, node);
    return node;
  }

  _commit() {
    this._items = this._items.concat(this._currentBatch);
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

      return Promise.map(node.next, (f) => this._fetchRecursive(ipfs, f, all, amount, depth), { concurrency: 1 })
        .then((res) => _.flatten(res.concat(result)))
    });
  }

  static getIpfsHash(ipfs, log) {
    if(!ipfs) throw new Error("Ipfs instance not defined")
    const data = new Buffer(JSON.stringify({ Data: JSON.stringify(log.snapshot) }));
    return ipfs.object.put(data)
      .then((res) => res.Hash)
  }

  static fromJson(ipfs, json) {
    return Promise.all(json.items.map((f) => Node.fromIpfsHash(ipfs, f)))
      .then((items) => new Log(ipfs, json.id, '', { items: items }));
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
    return MaxBatchSize
  }
}

module.exports = Log;
