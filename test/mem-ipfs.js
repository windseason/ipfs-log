'use strict';

const DAGNode = require('ipfs-merkle-dag').DAGNode;

let objects = {};

module.exports = {
  object : {
    get: (hash) => Promise.resolve(objects[hash]),
    put: (data) => {
      const d = new DAGNode(new Buffer(data, 'utf-8'));
      objects[d.toJSON().Hash] = d;
      return Promise.resolve(d);
    }
  }
}