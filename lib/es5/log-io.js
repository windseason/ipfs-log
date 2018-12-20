'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var Entry = require('./entry');

var EntryIO = require('./entry-io');

var Clock = require('./lamport-clock');

var LogError = require('./log-errors');

var _require = require('./utils'),
    isDefined = _require.isDefined,
    findUniques = _require.findUniques,
    difference = _require.difference;

var last = function last(arr, n) {
  return arr.slice(arr.length - n, arr.length);
};

var LogIO =
/*#__PURE__*/
function () {
  function LogIO() {
    (0, _classCallCheck2.default)(this, LogIO);
  }

  (0, _createClass2.default)(LogIO, null, [{
    key: "toMultihash",
    value: function () {
      var _toMultihash = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(ipfs, log) {
        var dagNode;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (isDefined(ipfs)) {
                  _context.next = 2;
                  break;
                }

                throw LogError.IPFSNotDefinedError();

              case 2:
                if (isDefined(log)) {
                  _context.next = 4;
                  break;
                }

                throw LogError.LogNotDefinedError();

              case 4:
                if (!(log.values.length < 1)) {
                  _context.next = 6;
                  break;
                }

                throw new Error("Can't serialize an empty log");

              case 6:
                _context.next = 8;
                return ipfs.dag.put(log.toBuffer());

              case 8:
                dagNode = _context.sent;
                return _context.abrupt("return", dagNode.toBaseEncodedString());

              case 10:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function toMultihash(_x, _x2) {
        return _toMultihash.apply(this, arguments);
      }

      return toMultihash;
    }()
    /**
     * Create a log from multihash
     * @param {IPFS} ipfs - An IPFS instance
     * @param {string} hash - Multihash (as a Base58 encoded string) to create the log from
     * @param {Number} [length=-1] - How many items to include in the log
     * @param {function(hash, entry, parent, depth)} onProgressCallback
     * @returns {Promise<Log>}
     */

  }, {
    key: "fromMultihash",
    value: function () {
      var _fromMultihash = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee2(ipfs, hash) {
        var length,
            exclude,
            onProgressCallback,
            dagNode,
            logData,
            entries,
            clock,
            finalEntries,
            heads,
            _args2 = arguments;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                length = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : -1;
                exclude = _args2.length > 3 ? _args2[3] : undefined;
                onProgressCallback = _args2.length > 4 ? _args2[4] : undefined;

                if (isDefined(ipfs)) {
                  _context2.next = 5;
                  break;
                }

                throw LogError.IPFSNotDefinedError();

              case 5:
                if (isDefined(hash)) {
                  _context2.next = 7;
                  break;
                }

                throw new Error("Invalid hash: ".concat(hash));

              case 7:
                _context2.next = 9;
                return ipfs.dag.get(hash);

              case 9:
                dagNode = _context2.sent;
                logData = JSON.parse(dagNode.value);

                if (!(!logData.heads || !logData.id)) {
                  _context2.next = 13;
                  break;
                }

                throw LogError.NotALogError();

              case 13:
                _context2.next = 15;
                return EntryIO.fetchAll(ipfs, logData.heads, length, exclude, null, onProgressCallback);

              case 15:
                entries = _context2.sent;
                // Find latest clock
                clock = entries.reduce(function (clock, entry) {
                  if (entry.clock.time > clock.time) {
                    return new Clock(entry.clock.id, entry.clock.time);
                  }

                  return clock;
                }, new Clock(logData.id));
                finalEntries = entries.slice().sort(Entry.compare);
                heads = finalEntries.filter(function (e) {
                  return logData.heads.includes(e.hash);
                });
                return _context2.abrupt("return", {
                  id: logData.id,
                  values: finalEntries,
                  heads: heads,
                  clock: clock
                });

              case 20:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function fromMultihash(_x3, _x4) {
        return _fromMultihash.apply(this, arguments);
      }

      return fromMultihash;
    }()
  }, {
    key: "fromEntryHash",
    value: function () {
      var _fromEntryHash = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee3(ipfs, entryHash, id) {
        var length,
            exclude,
            onProgressCallback,
            entryHashes,
            excludeHashes,
            entries,
            sliced,
            _args3 = arguments;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                length = _args3.length > 3 && _args3[3] !== undefined ? _args3[3] : -1;
                exclude = _args3.length > 4 ? _args3[4] : undefined;
                onProgressCallback = _args3.length > 5 ? _args3[5] : undefined;

                if (isDefined(ipfs)) {
                  _context3.next = 5;
                  break;
                }

                throw LogError.IpfsNotDefinedError();

              case 5:
                if (isDefined(entryHash)) {
                  _context3.next = 7;
                  break;
                }

                throw new Error("'entryHash' must be defined");

              case 7:
                // Convert input hash(es) to an array
                entryHashes = Array.isArray(entryHash) ? entryHash : [entryHash]; // Fetch given length, return size at least the given input entries

                length = length > -1 ? Math.max(length, 1) : length; // Make sure we pass hashes instead of objects to the fetcher function

                excludeHashes = exclude; // ? exclude.map(e => e.hash ? e.hash : e) : exclude

                _context3.next = 12;
                return EntryIO.fetchParallel(ipfs, entryHashes, length, excludeHashes, null, null, onProgressCallback);

              case 12:
                entries = _context3.sent;
                // Cap the result at the right size by taking the last n entries,
                // or if given length is -1, then take all
                sliced = length > -1 ? last(entries, length) : entries;
                return _context3.abrupt("return", {
                  values: sliced
                });

              case 15:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function fromEntryHash(_x5, _x6, _x7) {
        return _fromEntryHash.apply(this, arguments);
      }

      return fromEntryHash;
    }()
  }, {
    key: "fromJSON",
    value: function () {
      var _fromJSON = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee4(ipfs, json) {
        var length,
            timeout,
            onProgressCallback,
            headHashes,
            entries,
            finalEntries,
            _args4 = arguments;
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                length = _args4.length > 2 && _args4[2] !== undefined ? _args4[2] : -1;
                timeout = _args4.length > 3 ? _args4[3] : undefined;
                onProgressCallback = _args4.length > 4 ? _args4[4] : undefined;

                if (isDefined(ipfs)) {
                  _context4.next = 5;
                  break;
                }

                throw LogError.IPFSNotDefinedError();

              case 5:
                headHashes = json.heads.map(function (e) {
                  return e.hash;
                });
                _context4.next = 8;
                return EntryIO.fetchParallel(ipfs, headHashes, length, [], 16, timeout, onProgressCallback);

              case 8:
                entries = _context4.sent;
                finalEntries = entries.slice().sort(Entry.compare);
                return _context4.abrupt("return", {
                  id: json.id,
                  values: finalEntries,
                  heads: json.heads
                });

              case 11:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function fromJSON(_x8, _x9) {
        return _fromJSON.apply(this, arguments);
      }

      return fromJSON;
    }()
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
    key: "fromEntry",
    value: function () {
      var _fromEntry = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee5(ipfs, sourceEntries) {
        var length,
            exclude,
            onProgressCallback,
            excludeHashes,
            hashes,
            entries,
            combined,
            uniques,
            sliced,
            missingSourceEntries,
            replaceInFront,
            result,
            _args5 = arguments;
        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                length = _args5.length > 2 && _args5[2] !== undefined ? _args5[2] : -1;
                exclude = _args5.length > 3 ? _args5[3] : undefined;
                onProgressCallback = _args5.length > 4 ? _args5[4] : undefined;

                if (isDefined(ipfs)) {
                  _context5.next = 5;
                  break;
                }

                throw LogError.IPFSNotDefinedError();

              case 5:
                if (isDefined(sourceEntries)) {
                  _context5.next = 7;
                  break;
                }

                throw new Error("'sourceEntries' must be defined");

              case 7:
                if (!(!Array.isArray(sourceEntries) && !Entry.isEntry(sourceEntries))) {
                  _context5.next = 9;
                  break;
                }

                throw new Error("'sourceEntries' argument must be an array of Entry instances or a single Entry");

              case 9:
                if (!Array.isArray(sourceEntries)) {
                  sourceEntries = [sourceEntries];
                } // Fetch given length, return size at least the given input entries


                length = length > -1 ? Math.max(length, sourceEntries.length) : length; // Make sure we pass hashes instead of objects to the fetcher function

                excludeHashes = exclude ? exclude.map(function (e) {
                  return e.hash ? e.hash : e;
                }) : exclude;
                hashes = sourceEntries.map(function (e) {
                  return e.hash;
                }); // Fetch the entries

                _context5.next = 15;
                return EntryIO.fetchParallel(ipfs, hashes, length, excludeHashes, null, null, onProgressCallback);

              case 15:
                entries = _context5.sent;
                // Combine the fetches with the source entries and take only uniques
                combined = sourceEntries.concat(entries);
                uniques = findUniques(combined, 'hash').sort(Entry.compare); // Cap the result at the right size by taking the last n entries

                sliced = uniques.slice(length > -1 ? -length : -uniques.length); // Make sure that the given input entries are present in the result
                // in order to not lose references

                missingSourceEntries = difference(sliced, sourceEntries, 'hash');

                replaceInFront = function replaceInFront(a, withEntries) {
                  var sliced = a.slice(withEntries.length, a.length);
                  return withEntries.concat(sliced);
                }; // Add the input entries at the beginning of the array and remove
                // as many elements from the array before inserting the original entries


                result = replaceInFront(sliced, missingSourceEntries);
                return _context5.abrupt("return", {
                  id: result[result.length - 1].id,
                  values: result
                });

              case 23:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function fromEntry(_x10, _x11) {
        return _fromEntry.apply(this, arguments);
      }

      return fromEntry;
    }()
  }]);
  return LogIO;
}();

module.exports = LogIO;