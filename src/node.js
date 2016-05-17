'use strict';

const Buffer = require('buffer').Buffer

class Node {
  constructor(payload, next) {
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
    const node = new Node(data, next);
    return Node.getIpfsHash(ipfs, node)
      .then((hash) => {
        node.hash = hash;
        return node;
      });
  }

  static fromIpfsHash(ipfs, hash) {
    if(!ipfs) throw new Error("Node requires ipfs instance")
    if(!hash) throw new Error("Invalid hash: " + hash)
    return ipfs.object.get(hash, { enc: 'base58' })
      .then((obj) => {
        const f = JSON.parse(obj.toJSON().Data)
        return Node.create(ipfs, f.payload, f.next);
      });
  }

  static getIpfsHash(ipfs, node) {
    if(!ipfs) throw new Error("Node requires ipfs instance")
    return ipfs.object.put(new Buffer(JSON.stringify(node.asJson)))
      .then((res) => res.toJSON().Hash);
  }

  static equals(a, b) {
    return a.hash === b.hash;
  }
}

module.exports = Node;
