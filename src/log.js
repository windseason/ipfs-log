'use strict'

const GSet = require('./g-set')
const Entry = require('./entry')
const LogIO = require('./log-io')
const LogError = require('./log-errors')
const Clock = require('./lamport-clock')
const isDefined = require('./utils/is-defined')
const _uniques = require('./utils/uniques')

const randomId = () => new Date().getTime().toString()

/**
 * Log
 *
 * @description
 * Log implements a G-Set CRDT and adds ordering
 *
 * From:
 * "A comprehensive study of Convergent and Commutative Replicated Data Types"
 * https://hal.inria.fr/inria-00555588
 */
class Log extends GSet {
  /**
   * Create a new Log instance
   * @param  {IPFS}           ipfs    An IPFS instance
   * @param  {String}         id      ID of the log
   * @param  {[Array<Entry>]} entries An Array of Entries from which to create the log from
   * @param  {[Array<Entry>]} heads   Set the heads of the log
   * @param  {[Clock]}        clock   Set the clock of the log
   * @return {Log}            Log
   */
  constructor (ipfs, id, entries, heads, clock) {
    if (!isDefined(ipfs)) {
      throw LogError.ImmutableDBNotDefinedError()
    }

    if (isDefined(entries) && !Array.isArray(entries)) {
      throw new Error(`'entries' argument must be an array of Entry instances`)
    }

    if (isDefined(heads) && !Array.isArray(heads)) {
      throw new Error(`'heads' argument must be an array`)
    }

    super()

    this._storage = ipfs
    this._id = id || randomId()
    this._entries = entries || []
    this._heads = heads || Log.findHeads(this._entries)

    const maxTime = Math.max(clock ? clock.time : 0, this._heads.reduce((res, acc) => Math.max(res, acc.clock.time), 0))
    this._clock = new Clock(this.id, maxTime)
  }

  /**
   * Returns the ID of the log
   * @returns {string}
   */
  get id () {
    return this._id
  }

  /**
   * Returns the clock of the log
   * @returns {string}
   */
  get clock () {
    return this._clock
  }

  /**
   * Returns the length of the log
   * @return {Number} Length
   */
  get length () {
    return this.values.length
  }

  /**
   * Returns the values in the log
   * @returns {Array<Entry>}
   */
  get values () {
    return this._entries
  }

  /**
   * Returns an array of heads as multihashes
   * @returns {Array<string>}
   */
  get heads () {
    return this._heads
  }

  /**
   * Returns an array of Entry objects that reference entries which
   * are not in the log currently
   * @returns {Array<Entry>}
   */
  get tails () {
    return Log.findTails(this.values)
  }

  /**
   * Returns an array of multihashes that are referenced by entries which
   * are not in the log currently
   * @returns {Array<string>} Array of multihashes
   */
  get tailHashes () {
    return Log.findTailHashes(this.values)
  }

  /**
   * Find an entry
   * @param {string} [hash] The Multihash of the entry as Base58 encoded string
   * @returns {Entry|undefined}
   */
  get (hash) {
    return this.values.find(e => e.hash === hash)
  }

  has (entry) {
    var isEqual = e => Entry.isEqual(e, entry)
    return this.values.find(isEqual) !== undefined
  }

  /**
   * Append an entry to the log
   * @param  {Entry} entry Entry to add
   * @return {Log}   New Log containing the appended value
   */
  append (data) {
    // Update the clock (find the latest clock)
    const newTime = Math.max(this.clock.time, this.heads.reduce((res, acc) => Math.max(res, acc.clock.time), 0)) + 1
    this._clock = new Clock(this.clock.id, newTime)

    // Add the entry to the log,
    // as a named function to make it optimizable for VMs
    const appendToLog = (entry) => {
      this._entries.push(entry)
      this._heads = [entry]
    }

    // Create the entry and add it to the log
    return Entry.create(this._storage, this.id, null, data, this.heads, this.clock)
      .then(appendToLog)
      .then(() => this)
  }

  merge (values) {
    var combined = []
    combined = this.values.concat(values)
    var uniques = _uniques(combined, 'hash')
    return uniques.sort(Entry.compare)
  }

  /**
   * Join two logs
   *
   * @description Joins two logs returning a new log. Doesn't mutate the original logs.
   *
   * @param {IPFS}   [ipfs] An IPFS instance
   * @param {Log}    log    Log to join with this Log
   * @param {Number} [size] Max size of the joined log
   * @param {string} [id]   ID to use for the new log
   *
   * @example
   * log1.join(log2)
   *
   * @returns {Log}
   */
  join (log, size = -1, id) {
    if (!isDefined(log)) throw LogError.LogNotDefinedError()
    if (!Log.isLog(log)) throw LogError.NotALogError()

    // If id is not specified, use greater id of the two logs
    id = id ? id : [log, this].sort((a, b) => a.id > b.id)[0].id

    // Combine the first log entries with the second log entries,
    let merged = this.merge(log.values)

    if (size > -1) {
      merged = merged.slice(-size)
    }

    // Find the latest clock
    const maxClockTime = Math.max(this.clock.time, merged[merged.length - 1] ? merged[merged.length - 1].clock.time : 0)
    let clock = new Clock(this.id, maxClockTime)

    // this._heads = Log.findHeads(merged)
    this._heads = Log.findHeads(this.heads.concat(log.heads))
    this._entries = merged
    this._id = id
    this._clock = clock
    return this
  }

  /**
   * Get the log in JSON format
   * @returns {Object<{heads}>}
   */
  toJSON () {
    return {
      id: this.id,
      heads: this.heads.map(e => e.hash)
    }
  }

  toSnapshot () {
    return {
      id: this.id,
      heads: this.heads,
      values: this.values,
    }
  }
  /**
   * Get the log as a Buffer
   * @returns {Buffer}
   */
  toBuffer () {
    return Buffer.from(JSON.stringify(this.toJSON()))
  }

  /**
   * Returns the log entries as a formatted string
   * @example
   * two
   * └─one
   *   └─three
   * @returns {string}
   */
  toString (payloadMapper) {
    return this.values
      .slice()
      .reverse()
      .map((e, idx) => {
        const parents = Entry.findChildren(e, this.values)
        const len = parents.length
        let padding = new Array(Math.max(len - 1, 0))
        padding = len > 1 ? padding.fill('  ') : padding
        padding = len > 0 ? padding.concat(['└─']) : padding
        return padding.join('') + (payloadMapper ? payloadMapper(e.payload) : e.payload)
      })
      .join('\n')
  }

  /**
   * Check whether an object is a Log instance
   * @param {Object} log An object to check
   * @returns {true|false}
   */
  static isLog (log) {
    return log.id !== undefined
      && log.heads !== undefined
      && log.values !== undefined
  }

  /**
   * Get the log's multihash
   * @returns {Promise<string>} Multihash of the Log as Base58 encoded string
   */
  toMultihash () {
    return LogIO.toMultihash(this._storage, this)
  }

  /**
   * Create a log from multihash
   * @param {IPFS}   ipfs        An IPFS instance
   * @param {string} hash        Multihash (as a Base58 encoded string) to create the log from
   * @param {Number} [length=-1] How many items to include in the log
   * @param {Function(hash, entry, parent, depth)} onProgressCallback
   * @return {Promise<Log>}      New Log
   */
  static fromMultihash (ipfs, hash, length = -1, exclude, onProgressCallback) {
    if (!isDefined(ipfs)) throw LogError.ImmutableDBNotDefinedError()
    if (!isDefined(hash)) throw new Error(`Invalid hash: ${hash}`)

    return LogIO.fromMultihash(ipfs, hash, length, exclude, onProgressCallback)
      .then((data) => new Log(ipfs, data.id, data.values, data.heads, data.clock))
  }

  /**
   * Create a log from a single entry's multihash
   * @param {IPFS}   ipfs        An IPFS instance
   * @param {string} hash        Multihash (as a Base58 encoded string) of the Entry from which to create the log from
   * @param {Number} [length=-1] How many entries to include in the log
   * @param {Function(hash, entry, parent, depth)} onProgressCallback
   * @return {Promise<Log>}      New Log
   */
  static fromEntryHash (ipfs, hash, id, length = -1, exclude, onProgressCallback) {
    if (!isDefined(ipfs)) throw LogError.ImmutableDBNotDefinedError()
    if (!isDefined(hash)) throw new Error("'hash' must be defined")

    return LogIO.fromEntryHash(ipfs, hash, id, length, exclude, onProgressCallback)
      .then((data) => new Log(ipfs, id, data.values))
  }

  /**
   * Create a log from a Log Snapshot JSON
   * @param {IPFS} ipfs          An IPFS instance
   * @param {Object} json        Log snapshot as JSON object
   * @param {Number} [length=-1] How many entries to include in the log
   * @param {Function(hash, entry, parent, depth)} [onProgressCallback]
   * @return {Promise<Log>}      New Log
   */
  static fromJSON (ipfs, json, length = -1, onProgressCallback) {
    if (!isDefined(ipfs)) throw LogError.ImmutableDBNotDefinedError()

    return LogIO.fromJSON(ipfs, json, length, onProgressCallback)
      .then((data) => new Log(ipfs, data.id, data.values, data.heads))
  }

  /**
   * Create a new log from an Entry instance
   * @param {IPFS}                ipfs          An IPFS instance
   * @param {Entry|Array<Entry>}  sourceEntries An Entry or an array of entries to fetch a log from
   * @param {Number}              [length=-1]   How many entries to include. Default: infinite.
   * @param {Array<Entry|string>} [exclude]     Array of entries or hashes or entries to not fetch (foe eg. cached entries)
   * @param {Function(hash, entry, parent, depth)} [onProgressCallback]
   * @return {Promise<Log>}       New Log
   */
  static fromEntry (ipfs, sourceEntries, length = -1, exclude, onProgressCallback) {
    if (!isDefined(ipfs)) throw LogError.ImmutableDBNotDefinedError()
    if (!isDefined(sourceEntries)) throw new Error("'sourceEntries' must be defined")

    return LogIO.fromEntry(ipfs, sourceEntries, length, exclude, onProgressCallback)
      .then((data) => new Log(ipfs, data.id, data.values))
  }

  /**
   * Expands the log with a specified number of new values
   *
   * @param  {IPFS}               ipfs    An IPFS instance
   * @param  {Log}                log     Log to expand
   * @param  {Entry|Array<Entry>} entries An Entry or an Array of entries to expand from
   * @param  {Number}             amount  How many new entries to include
   * @return {Promise<Log>}       New Log
   */
  static expandFrom (ipfs, log, entries, amount = -1) {
    if (!isDefined(ipfs)) throw LogError.ImmutableDBNotDefinedError()
    if (!isDefined(log)) throw LogError.LogNotDefinedError()
    if (!isDefined(entries)) throw new Error(`'entries' must be given as argument`)
    if (!Log.isLog(log)) throw LogError.NotALogError()

    return LogIO.expandFrom(ipfs, log, entries, amount)
      .then((data) => new Log(ipfs, log.id, data.values, null, log.clock))
  }

  /**
   * Expands the log with a specified amount of Entries
   * @param  {IPFS}   ipfs   An IPFS instance
   * @param  {Log}    log    Log to expand
   * @param  {Number} amount How many new entries to include
   * @return {Promise<Log>}  New Log
   */
  static expand (ipfs, log, amount) {
    if (!isDefined(ipfs)) throw LogError.ImmutableDBNotDefinedError()
    if (!isDefined(log)) throw LogError.LogNotDefinedError()
    if (!Log.isLog(log)) throw LogError.NotALogError()

    return LogIO.expand(ipfs, log, amount)
      .then((data) => new Log(ipfs, log.id, data.values, log.heads, log.clock))
  }

  /**
   * Find heads from a collection of entries
   *
   * @description
   * Finds entries that are the heads of this collection,
   * ie. entries that are not referenced by other entries
   *
   * @param {Array<Entry>} Entries to search heads from
   * @returns {Array<Entry>}
   */
  static findHeads (entries) {
    var indexReducer = (res, entry, idx, arr) => {
      var addToResult = e => res[e] = entry.hash
      entry.next.forEach(addToResult)
      return res
    }

    var items = entries.reduce(indexReducer, {})

    var exists = e => items[e.hash] === undefined
    var compareIds = (a, b) => a.id > b.id

    return entries.filter(exists).sort(compareIds)
  }

  // Find entries that point to another entry that is not in the
  // input array
  static findTails (entries) {
    // Reverse index { next -> entry }
    var reverseIndex = {}
    // Null index containing entries that have no parents (nexts)
    var nullIndex = []
    // Hashes for all entries for quick lookups
    var hashes = {}
    // Hashes of all next entries
    var nexts = []

    var addToIndex = (e) => {
      if (e.next.length === 0) {
        nullIndex.push(e)
      }
      var addToReverseIndex = (a) => {
        /* istanbul ignore else */
        if (!reverseIndex[a]) reverseIndex[a] = []
        reverseIndex[a].push(e)
      }

      // Add all entries and their parents to the reverse index
      e.next.forEach(addToReverseIndex)
      // Get all next references
      nexts = nexts.concat(e.next)
      // Get the hashes of input entries
      hashes[e.hash] = true
    }

    // Create our indices
    entries.forEach(addToIndex)

    var addUniques = (res, entries, idx, arr) => res.concat(_uniques(entries, 'hash'))
    var exists = e => hashes[e] === undefined
    var findFromReverseIndex = e => reverseIndex[e]

    // Drop hashes that are not in the input entries
    const tails = nexts // For every multihash in nexts:
      .filter(exists) // Remove undefineds and nulls
      .map(findFromReverseIndex) // Get the Entry from the reverse index
      .reduce(addUniques, []) // Flatten the result and take only uniques
      .concat(nullIndex) // Combine with tails the have no next refs (ie. first-in-their-chain)

    return _uniques(tails, 'hash').sort(Entry.compare)
  }

  // Find the hashes to entries that are not in a collection
  // but referenced by other entries
  static findTailHashes (entries) {
    var hashes = {}
    var addToIndex = (e) => hashes[e.hash] = true

    var reduceTailHashes = (res, entry, idx, arr) => {
      var addToResult = (e) => {
        /* istanbul ignore else */
        if (hashes[e] === undefined) {
          res.splice(0, 0, e)
        }
      }
      entry.next.reverse().forEach(addToResult)
      return res
    }

    entries.forEach(addToIndex)
    return entries.reduce(reduceTailHashes, [])
  }
}

module.exports = Log
