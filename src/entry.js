'use strict';

class Entry {
  constructor(payload, next) {
    this.payload = payload || null;
    this.hash = null;
    this.next = next ? (next instanceof Array ? next : [next]) : [];
    this.next = this.next.map((next) => next instanceof Entry ? next.hash : next) // Convert instances of Entry to hashes
  }

  get asJson() {
    let res = { payload: this.payload }
    let next = this.next.map((entry) => entry instanceof Entry ? entry.hash : entry) // Convert instances of Entry to hashes
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
    if(data instanceof Entry) return Promise.resolve(data);
    const entry = new Entry(data, next);
    return Entry.getIpfsHash(ipfs, entry.asJson)
      .then((hash) => {
        entry.hash = hash;
        return entry;
      });
  }

  static getIpfsHash(ipfs, entry) {
    if(!ipfs) throw new Error("Entry requires ipfs instance")
    const data = new Buffer(JSON.stringify(entry))
    return ipfs.object.put(data)
      .then((res) => res.toJSON().Hash);
  }

  static fromIpfsHash(ipfs, hash) {
    if(!ipfs) throw new Error("Entry requires ipfs instance")
    if(!hash) throw new Error("Invalid hash: " + hash)
    return ipfs.object.get(hash, { enc: 'base58' })
      .then((obj) => {
        const f = JSON.parse(obj.toJSON().Data)
        return Entry.create(ipfs, f.payload, f.next);
      });
  }

  static equals(a, b) {
    return a.hash === b.hash;
  }
}

module.exports = Entry;
