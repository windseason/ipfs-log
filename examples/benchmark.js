'use strict';

const await   = require('asyncawait/await');
const async   = require('asyncawait/async');
const ipfsd = require('ipfsd-ctl');
const Log   = require('../src/log');
const Node   = require('../src/node');

const startIpfs = () => {
  return new Promise((resolve, reject) => {
    // ipfsd.disposableApi((err, ipfs) => {
    //   if(err) console.error(err);
    //   resolve(ipfs);
    // });
    ipfsd.local((err, node) => {
      if(err) reject(err);
      node.startDaemon((err, ipfs) => {
        if(err) reject(err);
        resolve(ipfs);
      });
    });
  });
};

// Metrics
let totalQueries = 0;
let seconds = 0;
let queriesPerSecond = 0;
let lastTenSeconds = 0;
let store;

let run = (() => {
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

  startIpfs().then(async((ipfs) => {
    const log = new Log(ipfs, 'A');
    for(var i = 0; i < 20000; i ++) {
      // let timer = new Timer();
      // timer.start();
      // const data = new Buffer(JSON.stringify({ Data: JSON.stringify(totalQueries) }));
      // await(ipfs.object.put(data));
      // await(Node.create(ipfs, totalQueries, []));
      await(log.add(totalQueries));
      // console.log(`${timer.stop(true)} ms`);
      totalQueries ++;
      lastTenSeconds ++;
      queriesPerSecond ++;
    }

    process.exit(0);

  })).catch((e) => console.error(e));
})();

module.exports = run;
