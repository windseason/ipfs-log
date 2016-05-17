'use strict';

const IPFS = require('exports?Ipfs!ipfs/dist/index.js')
const Log = require('../../src/log');
// const ipfsAPI = require('ipfs-api');
const ipfs = new IPFS();

const log = new Log(ipfs, 'A');
log.add('one').then((node1) => {
  console.log('Node1:', node1.hash, node1.payload, node1);
  log.add('two').then((node2) => {
    console.log('Node2:', node2.hash, node2.payload, node2);
    console.log('Node2.next:', node2.next[0]);
  });
});
