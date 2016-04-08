'use strict';

class Node {
  constructor(ipfs, payload, next) {
    this.payload = payload || null;
    this.hash = null;
    this.next = next ? (next instanceof Array ? next : [next]) : [];

    // Convert instances of Node to its hash
    this.next = this.next.map((f) => {
      if(f instanceof Node)
        return f.hash;
      return f;
    })
  }

  get asJson() {
    let res = { payload: this.payload }
    let next = this.next.map((f) => {
      if(f instanceof Node)
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
    if(!ipfs) throw new Error("Node requires ipfs instance")
    return new Promise((resolve, reject) => {
      const node = new Node(ipfs, data, next);
      Node.getIpfsHash(ipfs, node)
        .then((hash) => {
          node.hash = hash;
          resolve(node);
        }).catch(reject)
    });
  }

  static fromIpfsHash(ipfs, hash) {
    if(!ipfs) throw new Error("Node requires ipfs instance")
    if(!hash) throw new Error("Invalid hash: " + hash)
    return new Promise((resolve, reject) => {
      ipfs.object.get(hash)
        .then((obj) => {
          const f = JSON.parse(obj.Data)
          Node.create(ipfs, f.payload, f.next).then(resolve).catch(reject);
        }).catch(reject);
    });
  }

  static getIpfsHash(ipfs, node) {
    if(!ipfs) throw new Error("Node requires ipfs instance")
    return new Promise((resolve, reject) => {
      ipfs.object.put(new Buffer(JSON.stringify({ Data: JSON.stringify(node.asJson) })))
        .then((res) => resolve(res.Hash))
        .catch(reject);
    });
  }

  static equals(a, b) {
    return a.hash === b.hash;
  }
}

module.exports = Node;
