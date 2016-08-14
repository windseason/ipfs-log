'use strict';

const Log   = require('../src/log');
const Entry = require('../src/entry');
const ipfsd = require('ipfsd-ctl');
const IPFS  = require('ipfs')

const startIpfs = () => {
  return new Promise((resolve, reject) => {
    // Use disposable ipfs api with a local daemon
    ipfsd.disposableApi((err, ipfs) => {
      if(err) reject(err)
      resolve(ipfs);
    });
    // Use a local running daemon
    // ipfsd.local((err, node) => {
    //   if(err) reject(err);
    //   node.startDaemon((err, ipfs) => {
    //     if(err) reject(err);
    //     resolve(ipfs);
    //   });
    // });
    // Use js-ipfs daemon
    // const ipfs = new IPFS();
    // ipfs.goOnline(() => {
    //   resolve(ipfs)
    // })
  });
};

// Metrics
let totalQueries = 0;
let seconds = 0;
let queriesPerSecond = 0;
let lastTenSeconds = 0;
let log;

const queryLoop = () => {
  log.add(totalQueries)
    .then(() => {
      totalQueries ++;
      lastTenSeconds ++;
      queriesPerSecond ++;
      setTimeout(() => {
        process.nextTick(queryLoop);
      }, 0)
    })
    .catch((e) => {
      console.log(e)
      process.exit(0);
    })
}

let run = (() => {
  console.log("Starting benchmark...");

  startIpfs().then((ipfs) => {
    // Output metrics at 1 second interval
    setInterval(() => {
      seconds ++;
      if(seconds % 10 === 0) {
        console.log(`--> Average of ${lastTenSeconds/10} q/s in the last 10 seconds`);
        if(lastTenSeconds === 0)
          throw new Error("Problems!");
        lastTenSeconds = 0;
      }
      console.log(`${queriesPerSecond} queries per second, ${totalQueries} queries in ${seconds} seconds`);
      queriesPerSecond = 0;
    }, 1000);

    log = new Log(ipfs, 'A');
    queryLoop()
  }).catch((e) => console.error(e))

})();

module.exports = run;
