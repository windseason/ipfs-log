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

    const repo = new IPFSRepo(repoPath, repoConf)

    const ipfs = new IPFS({
      repo: repo,
      start: false,
      EXPERIMENTAL: {
        pubsub: true,
        sharding: false,
        dht: false
      }
    })

    ipfs.on('error', (err) => {
      reject(err)
    })

    ipfs.on('ready', () => {
      resolve({ ipfs, repo })
    })
  })
}

module.exports = startIpfs
