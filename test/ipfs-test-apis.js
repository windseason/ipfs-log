'use strict';

const IPFS    = require('ipfs')
const ipfsd   = require('ipfsd-ctl');
const MemIpfs = require('./mem-ipfs');

const IpfsApis = [
  {
    // mem-ipfs
    name: 'mem-ipfs',
    start: () => Promise.resolve(MemIpfs),
    stop: () => Promise.resolve()
  },
  {
    // js-ipfs
    name: 'js-ipfs',
    start: () => {
      return new Promise((resolve, reject) => {
        const ipfs = new IPFS();
        // ipfs.goOnline(() => resolve(ipfs));
        resolve(ipfs);
      });
    },
    stop: () => Promise.resolve()
    // stop: () => new Promise((resolve, reject) => ipfs.goOffline(resolve))
  },
  {
    // js-ipfs-api via local daemon
    name: 'js-ipfs-api',
    start: () => {
      return new Promise((resolve, reject) => {
        ipfsd.disposableApi((err, ipfs) => {
          if(err) console.error(err);
          resolve(ipfs);
        });
        // ipfsd.local((err, node) => {
        //   if(err) reject(err);
        //   ipfsDaemon = node;
        //   ipfsDaemon.startDaemon((err, ipfs) => {
        //     if(err) reject(err);
        //     resolve(ipfs);
        //   });
        // });
      });
    },
    stop: () => Promise.resolve()
    // stop: () => new Promise((resolve, reject) => ipfsDaemon.stopDaemon(resolve))
  }
];

module.exports = IpfsApis;
