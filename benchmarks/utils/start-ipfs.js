const IPFS = require('ipfs')
const IPFSRepo = require('ipfs-repo')
const DatastoreLevel = require('datastore-level')

const startIpfs = (repoPath) => {
  return new Promise((resolve, reject) => {
    const repoConf = {
      storageBackends: {
        blocks: DatastoreLevel
      }
    }

    ipfs = new IPFS({
      repo: new IPFSRepo(repoPath, repoConf),
      start: false,
      EXPERIMENTAL: {
        pubsub: false,
        sharding: false,
        dht: false
      }
    })

    ipfs.on('error', (err) => {
      reject(err)
    })

    ipfs.on('ready', () => {
      resolve(ipfs)
    })
  })
}

module.exports = startIpfs
