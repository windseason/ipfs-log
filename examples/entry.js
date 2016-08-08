'use strict';

const IPFS = require('ipfs')
const Entry = require('../src/entry');
const ipfs = new IPFS();

Entry.create(ipfs, 'Hello world!')
  .then((entry) => {
    console.log('Entry:', entry.hash, entry.payload);
    return entry;
  })
  .then((entry) => Entry.fromIpfsHash(ipfs, entry.hash))
  .then((entry) => {
    console.log('Entry from hash:', entry.hash, entry.payload);
    process.exit(0);
  })
  .catch((err) => console.error(err));
