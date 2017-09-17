'use strict'

const IPFS = require('ipfs')
const Log = require('../src/log')

const ipfs = new IPFS({
  repo: './ipfs/examples/log.js',
  start: false,
  EXPERIMENTAL: {
    pubsub: true
  },
})

ipfs.on('error', (err) => console.error(err))
ipfs.on('ready', () => {
  let log1 = new Log(ipfs, 'A')
  let log2 = new Log(ipfs, 'A')
  let log3 = new Log(ipfs, 'C')

  log1.append('one')
    .then((log) => {
      console.log(log1.values)
      // [ { hash: 'QmTctXe3aLBowJkNFZjH1U5JzHJtP6bHjagno6AxcHuua4',
      //     id: 'A',
      //     payload: 'one',
      //     next: [],
      //     v: 0,
      //     clock: LamportClock { id: 'A', time: 1 } } ]
    })
    .then(() => log1.append('two'))
    .then((log) => log2.append('three'))
    .then((log) => {
      // Join the logs
      log3.join(log1)
      log3.join(log2)
      console.log(log3.toString())
      // two
      // └─one
      // three
      process.exit(0)
    })
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
})
