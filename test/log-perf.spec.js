// 'use strict';

// const _      = require('lodash');
// const assert = require('assert');
// const async  = require('asyncawait/async');
// const await  = require('asyncawait/await');
// const Log    = require('../src/log');
// const Entry  = require('../src/entry');
// const IPFS   = require('ipfs')
// // const ipfsd  = require('ipfsd-ctl');

// let ipfs;

// const startIpfs = () => {
//   return new Promise((resolve, reject) => {
//     // Use disposable ipfs api with a local daemon
//     // ipfsd.disposableApi((err, ipfs) => {
//     //   if(err) console.error(err);
//     //   resolve(ipfs);
//     // });
//     // Use a local running daemon
//     // ipfsd.local((err, node) => {
//     //   if(err) reject(err);
//     //   node.startDaemon((err, ipfs) => {
//     //     if(err) reject(err);
//     //     resolve(ipfs);
//     //   });
//     // });
//     // Use js-ipfs daemon
//     const ipfs = new IPFS();
//     ipfs.goOnline(() => {
//       resolve(ipfs)
//     })
//   });
// };

// describe('ipfs-log - Performance Measurement', async(function() {
//   this.timeout(300000);
//   before(async((done) => {
//     try {
//       ipfs = await(startIpfs());
//     } catch(e) {
//       console.log(e);
//       assert.equal(e, null);
//     }
//     done();
//   }));

//   it('add', async((done) => {
//     let ms = 0;

//     for(let t = 1000; t <= 5000; t += 1000) {
//       const log = new Log(ipfs, 'A');
//       const startTime = new Date().getTime();

//       for(let i = 0; i < t; i ++) {
//         await(log.add("hello" + i));
//       }

//       const endTime = new Date().getTime();
//       console.log(`  > ${t} took ${(endTime - startTime)} ms`)
//     }

//     assert.equal(true, true);
//     done();
//   }));

// }));
