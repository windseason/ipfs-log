'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pMap = require('p-map');
var Entry = require('./entry');
var EntryIO = require('./entry-io');
var Clock = require('./lamport-clock');
var LogError = require('./log-errors');
var isDefined = require('./utils/is-defined');
var _uniques = require('./utils/uniques');
var intersection = require('./utils/intersection');
var difference = require('./utils/difference');

var last = function last(arr, n) {
  return arr.slice(arr.length - n, arr.length);
};
var uniqueEntriesReducer = function uniqueEntriesReducer(res, acc) {
  res[acc.hash] = acc;
  return res;
};

var LogIO = function () {
  function LogIO() {
    (0, _classCallCheck3.default)(this, LogIO);
  }

  (0, _createClass3.default)(LogIO, null, [{
    key: 'toMultihash',
    value: function toMultihash(ipfs, log) {
      if (!isDefined(ipfs)) throw LogError.ImmutableDBNotDefinedError();
      if (!isDefined(log)) throw LogError.LogNotDefinedError();

      if (log.values.length < 1) throw new Error('Can\'t serialize an empty log');

      return ipfs.object.put(log.toBuffer()).then(function (dagNode) {
        return dagNode.toJSON().multihash;
      });
    }

    /**
     * Create a log from multihash
     * @param {IPFS} ipfs - An IPFS instance
     * @param {string} hash - Multihash (as a Base58 encoded string) to create the log from
     * @param {Number} [length=-1] - How many items to include in the log
     * @param {function(hash, entry, parent, depth)} onProgressCallback
     * @returns {Promise<Log>}
     */

  }, {
    key: 'fromMultihash',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(ipfs, hash) {
        var length = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
        var exclude = arguments[3];
        var onProgressCallback = arguments[4];
        var dagNode, logData, entries, uniques, clock, finalEntries, heads;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (isDefined(ipfs)) {
                  _context.next = 2;
                  break;
                }

                throw LogError.ImmutableDBNotDefinedError();

              case 2:
                if (isDefined(hash)) {
                  _context.next = 4;
                  break;
                }

                throw new Error('Invalid hash: ' + hash);

              case 4:
                _context.next = 6;
                return ipfs.object.get(hash, { enc: 'base58' });

              case 6:
                dagNode = _context.sent;
                logData = JSON.parse(dagNode.toJSON().data);

                if (!(!logData.heads || !logData.id)) {
                  _context.next = 10;
                  break;
                }

                throw LogError.NotALogError();

              case 10:
                _context.next = 12;
                return EntryIO.fetchParallel(ipfs, logData.heads, length, exclude, null, null, onProgressCallback);

              case 12:
                entries = _context.sent;
                uniques = (0, _values2.default)(entries.reduce(uniqueEntriesReducer, {})

                // Find latest clock
                );
                clock = uniques.reduce(function (clock, entry) {
                  return entry.clock.time > clock.time ? new Clock(entry.clock.id, entry.clock.time) : clock;
                }, new Clock(logData.id)

                // Cut the entries to the requested size
                );
                finalEntries = length > -1 ? last(uniques.sort(Entry.compare), length) : uniques;

                // Find the head entries

                heads = finalEntries.filter(function (e) {
                  return logData.heads.includes(e.hash);
                });
                return _context.abrupt('return', {
                  id: logData.id,
                  values: finalEntries,
                  heads: heads,
                  clock: clock
                });

              case 18:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function fromMultihash(_x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return fromMultihash;
    }()
  }, {
    key: 'fromEntryHash',
    value: function fromEntryHash(ipfs, entryHash, id) {
      var length = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : -1;
      var exclude = arguments[4];
      var onProgressCallback = arguments[5];

      if (!isDefined(ipfs)) throw LogError.IpfsNotDefinedError();
      if (!isDefined(entryHash)) throw new Error("'entryHash' must be defined");

      // Fetch given length, return size at least the given input entries
      length = length > -1 ? Math.max(length, 1) : length;

      // Make sure we pass hashes instead of objects to the fetcher function
      var excludeHashes = exclude; // ? exclude.map(e => e.hash ? e.hash : e) : exclude

      return EntryIO.fetchParallel(ipfs, [entryHash], length, excludeHashes, null, null, onProgressCallback).then(function (entries) {
        // Cap the result at the right size by taking the last n entries,
        // or if given length is -1, then take all
        var sliced = length > -1 ? last(entries, length) : entries;
        return {
          values: sliced
        };
      });
    }
  }, {
    key: 'fromJSON',
    value: function fromJSON(ipfs, json) {
      var length = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
      var key = arguments[3];
      var timeout = arguments[4];
      var onProgressCallback = arguments[5];

      if (!isDefined(ipfs)) throw LogError.ImmutableDBNotDefinedError();
      return EntryIO.fetchParallel(ipfs, json.heads.map(function (e) {
        return e.hash;
      }), length, [], 16, timeout, onProgressCallback).then(function (entries) {
        var finalEntries = entries.slice().sort(Entry.compare);
        var heads = entries.filter(function (e) {
          return json.heads.includes(e.hash);
        });
        return {
          id: json.id,
          values: finalEntries,
          heads: json.heads
        };
      });
    }

    /**
     * Create a new log starting from an entry
     * @param {IPFS} ipfs An IPFS instance
     * @param {Array<Entry>} entries An entry or an array of entries to fetch a log from
     * @param {Number} [length=-1] How many entries to include. Default: infinite.
     * @param {Array<Entry|string>} [exclude] Entries to not fetch (cached)
     * @param {function(hash, entry, parent, depth)} [onProgressCallback]
     * @returns {Promise<Log>}
     */

  }, {
    key: 'fromEntry',
    value: function fromEntry(ipfs, sourceEntries) {
      var length = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
      var exclude = arguments[3];
      var key = arguments[4];
      var keys = arguments[5];
      var onProgressCallback = arguments[6];

      if (!isDefined(ipfs)) throw LogError.ImmutableDBNotDefinedError();
      if (!isDefined(sourceEntries)) throw new Error("'sourceEntries' must be defined");

      // Make sure we only have Entry objects as input
      if (!Array.isArray(sourceEntries) && !Entry.isEntry(sourceEntries)) {
        throw new Error('\'sourceEntries\' argument must be an array of Entry instances or a single Entry');
      }

      if (!Array.isArray(sourceEntries)) {
        sourceEntries = [sourceEntries];
      }

      // Fetch given length, return size at least the given input entries
      length = length > -1 ? Math.max(length, sourceEntries.length) : length;

      // Make sure we pass hashes instead of objects to the fetcher function
      var excludeHashes = exclude ? exclude.map(function (e) {
        return e.hash ? e.hash : e;
      }) : exclude;
      var hashes = sourceEntries.map(function (e) {
        return e.hash;
      });

      return EntryIO.fetchParallel(ipfs, hashes, length, excludeHashes, null, null, onProgressCallback).then(function (entries) {
        var combined = sourceEntries.concat(entries);
        var uniques = _uniques(combined, 'hash').sort(Entry.compare

        // Cap the result at the right size by taking the last n entries
        );var sliced = uniques.slice(length > -1 ? -length : -uniques.length

        // Make sure that the given input entries are present in the result
        // in order to not lose references
        );var missingSourceEntries = difference(sliced, sourceEntries, 'hash');

        var replaceInFront = function replaceInFront(a, withEntries) {
          var sliced = a.slice(withEntries.length, a.length);
          return withEntries.concat(sliced);
        };

        // Add the input entries at the beginning of the array and remove
        // as many elements from the array before inserting the original entries
        var result = replaceInFront(sliced, missingSourceEntries);
        return {
          id: result[result.length - 1].id,
          values: result
        };
      });
    }
  }]);
  return LogIO;
}();

module.exports = LogIO;