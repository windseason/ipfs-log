// 'use strict';

// const _      = require('lodash');
// const assert = require('assert');
// const async  = require('asyncawait/async');
// const await  = require('asyncawait/await');
// const ipfsd  = require('ipfsd-ctl');
// const Log    = require('../src/log');
// const Node   = require('../src/node');

// let ipfs;

// const startIpfs = () => {
//   return new Promise((resolve, reject) => {
//     // ipfsd.disposableApi((err, ipfs) => {
//     //   if(err) console.error(err);
//     //   resolve(ipfs);
//     // });
//     ipfsd.local((err, node) => {
//       if(err) reject(err);
//       node.startDaemon((err, ipfs) => {
//         if(err) reject(err);
//         resolve(ipfs);
//       });
//     });
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

//   it.only('add', async((done) => {
//     let ms = 0;

//     for(let t = 0; t <= 5000; t += 500) {
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
