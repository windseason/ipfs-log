'use strict'

const pWhilst = require('p-whilst')
const pMap = require('p-map')
const Entry = require('./entry')

let _tasksRequested = 0
let _tasksProcessed = 0

class EntryIO {
  // Fetch log graphs in parallel
  static fetchParallel (ipfs, hashes, length, exclude = [], concurrency, onProgressCallback) {
    const fetchOne = (hash) => EntryIO.fetchAll(ipfs, hash, length, exclude, null, onProgressCallback)
    const concatArrays = (arr1, arr2) => arr1.concat(arr2)
    const flatten = (arr) => arr.reduce(concatArrays, [])
    return pMap(hashes, fetchOne, { concurrency: Math.max(concurrency || hashes.length, 1) })
      .then(flatten) // Flatten the results
  }

  /**
   * Fetch log entries sequentially
   *
   * @param {IPFS} [ipfs] An IPFS instance
   * @param {string} [hash] Multihash of the entry to fetch
   * @param {string} [parent] Parent of the node to be fetched
   * @param {Object} [all] Entries to skip
   * @param {Number} [amount=-1] How many entries to fetch
   * @param {Number} [depth=0] Current depth of the recursion
   * @param {function(hash, entry, parent, depth)} onProgressCallback
   * @returns {Promise<Array<Entry>>}
   */
  static fetchAll (ipfs, hashes, amount, exclude = [], timeout = null, onProgressCallback) {
    let result = []
    let cache = {}
    let loadingQueue = Array.isArray(hashes)
      ? hashes.slice()
      : [hashes]

    // Add a multihash to the loading queue
    const addToLoadingQueue = e => loadingQueue.push(e)

    // Add entries that we don't need to fetch to the "cache"
    var addToExcludeCache = e => cache[e.hash] = e
    exclude.forEach(addToExcludeCache)

    const shouldFetchMore = () => {
      return loadingQueue.length > 0
          && (result.length < amount || amount < 0)
    }

    const fetchEntry = () => {
      const hash = loadingQueue.shift()

      if (cache[hash]) {
        return Promise.resolve()
      }

      return new Promise((resolve, reject) => {
        const addToResults = (entry) => {
          if (Entry.isEntry(entry)) {
            entry.next.forEach(addToLoadingQueue)
            result.push(entry)
            cache[hash] = entry
            _tasksProcessed ++
            if (onProgressCallback) {
              onProgressCallback(hash, entry, result.length)
            }
          }
        }

        _tasksRequested ++

        // Load the entry
        Entry.fromMultihash(ipfs, hash)
          .then(addToResults)
          .then(resolve)
      })
    }

    return pWhilst(shouldFetchMore, fetchEntry)
      .then(() => result)
  }
}

module.exports = EntryIO
