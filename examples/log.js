'use strict';

const ipfsd = require('ipfsd-ctl');
const Log   = require('../lib/log');

const startIpfs = () => {
  return new Promise((resolve, reject) => {
    ipfsd.disposableApi((err, ipfs) => resolve(ipfs));
  });
};

startIpfs().then((ipfs) => {
  Log.create(ipfs, 'A').then((log) => {
    log.add('one').then((node1) => {
      console.log('Node1:', node1.hash, node1.payload);
      log.add('two').then((node2) => {
        console.log('Node2:', node2.hash, node2.payload);
        console.log("       next -->", node2.next[0].hash, node2.next[0].payload);
        process.exit(0)
      });
    });
  }).catch((err) => console.error(err));
})