'use strict';

const Buffer = require('buffer').Buffer

class Entry {
  constructor(payload, next) {
    this.payload = payload || null;
    this.hash = null;
    this.next = next ? (next instanceof Array ? next : [next]) : [];

    // Convert instances of Entry to its hash
    this.next = this.next.map((f) => {
      if(f instanceof Entry)
        return f.hash;
      return f;
    })
  }

  get asJson() {
    let res = { payload: this.payload }
    let next = this.next.map((f) => {
      if(f instanceof Entry)
        return f.hash
      return f;
    });
    Object.assign(res, { next: next });
    return res;
  }

  hasChild(a) {
    for(let i = 0; i < this.next.length; i++) {
      if(this.next[i] === a.hash)
        return true;
    }
    return false;
  }

  static create(ipfs, data, next) {
    if(!ipfs) throw new Error("Entry requires ipfs instance")
    const entry = new Entry(data, next);
    return Entry.getIpfsHash(ipfs, entry)
      .then((hash) => {
        entry.hash = hash;
        return entry;
      });
  }

  static from(ipfs, data, nexts) {
    if(!ipfs) throw new Error("Entry requires ipfs instance")
    if(data instanceof Entry) return Promise.resolve(data);
    const entry = new Entry(data, nexts);
    return Entry.getIpfsHash(ipfs, entry)
      .then((hash) => {
        entry.hash = hash;
        return entry;
      });
  }

  static fromIpfsHash(ipfs, hash) {
    if(!ipfs) throw new Error("Entry requires ipfs instance")
    if(!hash) throw new Error("Invalid hash: " + hash)
    const get = (hash) => {
      return new Promise((resolve, reject) => {
        ipfs.object.get(hash, { enc: 'base58' })
          .then((obj) => {
            if(obj.toJSON().Size === 0)
              resolve(get(hash));
            else
              resolve(obj);
          })
      });
    };
    return get(hash).then((obj) => {
      const f = JSON.parse(obj.toJSON().Data)
      return Entry.create(ipfs, f.payload, f.next);
    });
  }

  static getIpfsHash(ipfs, entry) {
    if(!ipfs) throw new Error("Entry requires ipfs instance")
    return ipfs.object.put(new Buffer(JSON.stringify(entry.asJson)))
      .then((res) => res.toJSON().Hash);
  }

  static equals(a, b) {
    return a.hash === b.hash;
  }
}

module.exports = Entry;
