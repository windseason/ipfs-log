'use strict';

const _      = require('lodash');
const assert = require('assert');
const async  = require('asyncawait/async');
const await  = require('asyncawait/await');
const ipfsd  = require('ipfsd-ctl');
const Log    = require('../lib/log');
const Node   = require('../lib/node');

let ipfs;

const startIpfs = () => {
  return new Promise((resolve, reject) => {
    ipfsd.disposableApi((err, ipfs) => resolve(ipfs));
  });
};

describe('ipfs-log - Performance Measurement', async(function() {
  this.timeout(60000);
  before(async((done) => {
    try {
      ipfs = await(startIpfs());
    } catch(e) {
      console.log(e);
      assert.equal(e, null);
    }
    done();
  }));

  it.only('add', async((done) => {
    let ms = 0;

    for(let t = 100; t <= 1000; t += 300) {
      const log = await(Log.create(ipfs, 'A'));
      const startTime = new Date().getTime();

      for(let i = 0; i < t; i ++) {
        await(log.add("hello" + i));
      }

      const endTime = new Date().getTime();
      console.log(`  > ${t} took ${(endTime - startTime)} ms`)
    }

    assert.equal(true, true);
    done();
  }));

}));
