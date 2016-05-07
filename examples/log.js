'use strict';

const ipfsd = require('ipfsd-ctl');
const Log   = require('../src/log');

const startIpfs = () => {
  return new Promise((resolve, reject) => {
    ipfsd.disposableApi((err, ipfs) => resolve(ipfs));
  });
};

startIpfs().then((ipfs) => {
  const log = new Log(ipfs, 'A');
  log.add('one').then((node1) => {
    console.log('Node1:', node1.hash, node1.payload);
    log.add('two').then((node2) => {
      console.log('Node2:', node2.hash, node2.payload);
      console.log("       next -->", node2.next[0]);
      process.exit(0)
    });
  });
})