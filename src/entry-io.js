'use strict'

const pMap = require('p-map')
const pDoWhilst = require('p-do-whilst')
const Entry = require('./entry')

class EntryIO {
  // Fetch log graphs in parallel
  static fetchParallel (ipfs, hashes, length, exclude = [], concurrency, timeout, onProgressCallback) {
    const fetchOne = (hash) => EntryIO.fetchAll(ipfs, hash, length, exclude, timeout, onProgressCallback)
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
  static async fetchAll (ipfs, hashes, amount, exclude = [], timeout = null, onProgressCallback, onStartProgressCallback, concurrency = 32, delay = 0) {
    let result = []
    let cache = {}
    let loadingCache = {}
    let loadingQueue = Array.isArray(hashes)
      ? {0: hashes.slice()}
      : {0: [hashes]}

    // Add a multihash to the loading queue
    const addToLoadingQueue = (e, idx) => {
      if (!loadingCache[e]) {
        if (!loadingQueue[idx]) loadingQueue[idx] = []
        if (!loadingQueue[idx].includes(e)) {
          loadingQueue[idx].push(e)
        }
        loadingCache[e] = idx
      }
    }

    // Add entries that we don't need to fetch to the "cache"
    var addToExcludeCache = e => cache[e.hash] = e
    exclude.forEach(addToExcludeCache)

    const loadingQueueHasMore = () => Object.values(loadingQueue)
      .find(e => e && e.length > 0) !== undefined

    const shouldFetchMore = () => {
      return loadingQueueHasMore()
          && (result.length < amount || amount < 0)
    }

    const getNextFromQueue = (length = 1) => {
      const all = Object.values(loadingQueue).reduce((res, acc) => {
        while (acc.length > 0 && res.length < length) {
          const e = acc.shift()
          res.push(e)
        }
        return res
      }, [])
      return all
    }

    const fetchEntry = (entryHash) => {
      const hash = entryHash

      if (!hash || cache[hash]) {
        return Promise.resolve()
      }

      return new Promise((resolve, reject) => {
        // Resolve the promise after a timeout (if given) in order to
        // not get stuck loading a block that is unreachable
        // const timer = timeout 
        // ? setTimeout(() => {
        //     console.warn(`Warning: Couldn't fetch entry '${hash}', request timed out (${timeout}ms)`)
        //     resolve()
        //   } , timeout) 
        // : null

        const sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

        const addToResults = (entry) => {
          // clearTimeout(timer)
          if (Entry.isEntry(entry)) {
            try {
              entry.next.forEach(addToLoadingQueue)
              entry.refs.forEach(addToLoadingQueue)

              result.push(entry)
              cache[hash] = entry
              if (onProgressCallback) {
                onProgressCallback(hash, entry, result.length, result, loadingQueue)
              }
            } catch (e) {
              console.error(e)
            }
          }
        }

        if (onStartProgressCallback) {
          onStartProgressCallback(hash, null, result.length, result, loadingQueue)
        }

        // Load the entry
        Entry.fromMultihash(ipfs, hash)
          .then(addToResults)
          .then(async (entry) => {
            // Simulate network latency
            if (delay > 0)
              await sleep(delay)

            return entry
          })
          .then(resolve)
          .catch(err => {
            resolve()
          })
      })
    }

    let running = 0
    const _processQueue = async () => {
      if (running < concurrency) {
        const nexts = getNextFromQueue(concurrency)
        running += nexts.length
        await pMap(nexts, fetchEntry)
        running -= nexts.length
      }
    }

    await pDoWhilst(async () => await _processQueue(), shouldFetchMore)

    // Free memory to avoid minor GC
    cache = {}
    loadingCache = {}
    loadingQueue = []

    return result
  }
}

module.exports = EntryIO
