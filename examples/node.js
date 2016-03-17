'use strict';

const ipfsd = require('ipfsd-ctl');
const Node  = require('../lib/node');

const startIpfs = () => {
  return new Promise((resolve, reject) => {
    ipfsd.disposableApi((err, ipfs) => resolve(ipfs));
  });
};

startIpfs().then((ipfs) => {
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
        .catch((err) => console.error(err));
    })
    .catch((err) => console.error(err));
});