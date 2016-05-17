'use strict';

const IPFS = require('ipfs')
const Node = require('../src/node');
const ipfs = new IPFS();

Node.create(ipfs, 'Hello world!')
.then((node) => {
  console.log('Node:', node.hash, node.payload);
  return node;
})
.then((node) => {
  Node.fromIpfsHash(ipfs, node.hash)
    .then((node) => {
      console.log('Node from hash:', node.hash, node.payload);
      process.exit(0);
    })
})
.catch((err) => console.error(err));
