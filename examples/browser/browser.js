'use strict';

const IPFS = require('exports?Ipfs!ipfs/dist/index.js')
const Log = require('../../src/log');
// const ipfsAPI = require('ipfs-api');
const ipfs = new IPFS();

const log = new Log(ipfs, 'A');
log.add('one')
  .then((entry1) => {
    console.log('Entry1:', entry1.hash, entry1.payload, entry1);
    return log.add('two')
  })
  .then((entry2) => {
    console.log('Entry2:', entry2.hash, entry2.payload, entry2);
    console.log('Entry2.next:', entry2.next[0]);
  });