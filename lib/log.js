'use strict';

const _    = require('lodash');
const Lazy = require('lazy.js');
const Node = require('./node');

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

  // Insert to the log right after the latest parent
  _insert(node) {
    let indices = Lazy(node.next).map((next) => Lazy(this._items).map((f) => f.hash).indexOf(next.hash)) // Find the item's parent's indices
    const index = indices.toArray().length > 0 ? Math.max(indices.max() + 1, 0) : 0; // find the largest index (latest parent)
    this._items.splice(index, 0, node);
    return node;
  }

  _commit() {
    const current = Lazy(this._currentBatch).difference(this._items).toArray();
    this._items   = this._items.concat(current);
    this._currentBatch = [];
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
        });
    });
  }

  join(other) {
    return new Promise((resolve, reject) => {
      // const current = _.differenceWith(this._currentBatch, this._items, Node.equals);
      // const others  = _.differenceWith(other.items, this._items, Node.equals);
      // const final   = _.unionWith(current, others, Node.equals);

      const current = Lazy(this._currentBatch).difference(this._items).toArray();
      const others  = _.differenceWith(other.items, this._items, Node.equals);
      const final   = _.unionWith(current, others, Node.equals);

      this._items   = Lazy(this._items).concat(final).toArray();
      this._currentBatch = [];

      // Fetch history
      let allHashes = this.items.map((a) => a.hash);
      Log.fetchHistory(this._ipfs, other.items, allHashes).then((history) => {
        history.forEach((f) => this._insert(f)) // Insert to the list
        resolve(final);
      }).catch(reject);
    });
  }

  clear() {
    this._items = [];
    this._currentBatch = [];
  }

  /* Public */
  static create(ipfs, id, items) {
    if(!ipfs) throw new Error("Log requires ipfs instance")
    if(!id) throw new Error("Log requires an id")
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
    if(!ipfs) throw new Error("Node requires ipfs instance")
    if(!hash) throw new Error("Invalid hash: " + hash)
    return new Promise((resolve, reject) => {
      ipfs.object.get(hash)
        .then((res) => {
          const log = Log.fromJson(ipfs, JSON.parse(res.Data));
          resolve(log);
        }).catch(reject);
    });
  }

  /* Private */

  //TODO: merge fetchHistory and fetchRecursive

  static fetchHistory(ipfs, items, existing) {
    return new Promise((resolve, reject) => {
      const handle = Lazy(items)
        .reverse() // Start from the latest item
        .map((f) => f.next).flatten() // Go through all heads
        .filter((f) => !(f instanceof Node === true)) // OrbitNode vs. {}, filter out instances (we already have them in mem)
        .async() // Do the next map asynchronously
        .map((f) => {
          return Log.fetchRecursive(ipfs, f, existing, MaxHistory, 0)
                   .then((nodes) => Lazy(nodes).flatten().toArray())
                   .catch(reject);
        })
        .take(MaxHistory) // How many items from the history we should fetch
        .toArray();

      handle.onError(reject);
      handle.onComplete((array) => {
        Promise.all(array).then((res) => resolve(Lazy(res).flatten().toArray()));
      });
    });
  }

  static fetchRecursive(ipfs, hash, all, amount, depth) {
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

        // Process next node
        const handle = Lazy(node.next)
          .async()
          .map((f) => {
            return Log.fetchRecursive(ipfs, f, all, amount, depth)
                     .then((nodes) => Lazy(nodes).flatten().toArray())
                     .catch(reject);
          })
          .toArray()

        handle.onError(reject);
        handle.onComplete((array) => {
          result = result.concat(array);
          Promise.all(result).then((res) => resolve(Lazy(res).flatten().toArray()));
        });
      }).catch(reject);
    });
  }

  static findHeads(log) {
    return Lazy(log.items)
      .reverse()
      .filter((f) => !Log.isReferencedInChain(log, f))
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
