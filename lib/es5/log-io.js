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
    difference = _require.difference,
    dagNode = _require.dagNode;

var IPLD_LINKS = ['heads'];

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
    key: "toCID",

    /**
     * Get the CID of a Log.
     * @param {IPFS} ipfs An IPFS instance
     * @param {Log} log Log to get a CID for
     * @returns {Promise<string>}
     */
    value: function () {
      var _toCID = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(ipfs, log) {
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
                return _context.abrupt("return", dagNode.write(ipfs, 'dag-cbor', log.toJSON(), IPLD_LINKS));

              case 7:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function toCID(_x, _x2) {
        return _toCID.apply(this, arguments);
      }

      return toCID;
    }()
    /**
     * Get the multihash of a Log.
     * @param {IPFS} ipfs An IPFS instance
     * @param {Log} log Log to get a multihash for
     * @returns {Promise<string>}
     * @deprecated
     */

  }, {
    key: "toMultihash",
    value: function () {
      var _toMultihash = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee2(ipfs, log) {
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (isDefined(ipfs)) {
                  _context2.next = 2;
                  break;
                }

                throw LogError.IPFSNotDefinedError();

              case 2:
                if (isDefined(log)) {
                  _context2.next = 4;
                  break;
                }

                throw LogError.LogNotDefinedError();

              case 4:
                if (!(log.values.length < 1)) {
                  _context2.next = 6;
                  break;
                }

                throw new Error("Can't serialize an empty log");

              case 6:
                return _context2.abrupt("return", dagNode.write(ipfs, 'dag-pb', log.toJSON(), IPLD_LINKS));

              case 7:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function toMultihash(_x3, _x4) {
        return _toMultihash.apply(this, arguments);
      }

      return toMultihash;
    }()
    /**
     * Create a log from a CID.
     * @param {IPFS} ipfs An IPFS instance
     * @param {string} cid The CID of the log
     * @param {number} [length=-1] How many items to include in the log
     * @param {Array<Entry>} [exclude] Entries to not fetch (cached)
     * @param {function(cid, entry, parent, depth)} onProgressCallback
     * @returns {Promise<Log>}
     */

  }, {
    key: "fromCID",
    value: function () {
      var _fromCID = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee3(ipfs, cid) {
        var length,
            exclude,
            onProgressCallback,
            logData,
            entries,
            clock,
            finalEntries,
            heads,
            _args3 = arguments;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                length = _args3.length > 2 && _args3[2] !== undefined ? _args3[2] : -1;
                exclude = _args3.length > 3 ? _args3[3] : undefined;
                onProgressCallback = _args3.length > 4 ? _args3[4] : undefined;

                if (isDefined(ipfs)) {
                  _context3.next = 5;
                  break;
                }

                throw LogError.IPFSNotDefinedError();

              case 5:
                if (isDefined(cid)) {
                  _context3.next = 7;
                  break;
                }

                throw new Error("Invalid CID: ".concat(cid));

              case 7:
                _context3.next = 9;
                return dagNode.read(ipfs, cid, IPLD_LINKS);

              case 9:
                logData = _context3.sent;

                if (!(!logData.heads || !logData.id)) {
                  _context3.next = 12;
                  break;
                }

                throw LogError.NotALogError();

              case 12:
                _context3.next = 14;
                return EntryIO.fetchAll(ipfs, logData.heads, length, exclude, null, onProgressCallback);

              case 14:
                entries = _context3.sent;
                // Find latest clock
                clock = entries.reduce(function (clock, entry) {
                  if (entry.clock.time > clock.time) {
                    return new Clock(entry.clock.id, entry.clock.time);
                  }

                  return clock;
                }, new Clock(logData.id));
                finalEntries = entries.slice().sort(Entry.compare);
                heads = finalEntries.filter(function (e) {
                  return logData.heads.includes(e.cid);
                });
                return _context3.abrupt("return", {
                  id: logData.id,
                  values: finalEntries,
                  heads: heads,
                  clock: clock
                });

              case 19:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function fromCID(_x5, _x6) {
        return _fromCID.apply(this, arguments);
      }

      return fromCID;
    }()
  }, {
    key: "fromEntryCid",
    value: function () {
      var _fromEntryCid = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee4(ipfs, entryCid) {
        var length,
            exclude,
            onProgressCallback,
            entryCids,
            entries,
            sliced,
            _args4 = arguments;
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                length = _args4.length > 2 && _args4[2] !== undefined ? _args4[2] : -1;
                exclude = _args4.length > 3 ? _args4[3] : undefined;
                onProgressCallback = _args4.length > 4 ? _args4[4] : undefined;

                if (isDefined(ipfs)) {
                  _context4.next = 5;
                  break;
                }

                throw LogError.IpfsNotDefinedError();

              case 5:
                if (isDefined(entryCid)) {
                  _context4.next = 7;
                  break;
                }

                throw new Error("'entryCid' must be defined");

              case 7:
                // Convert input cid(s) to an array
                entryCids = Array.isArray(entryCid) ? entryCid : [entryCid]; // Fetch given length, return size at least the given input entries

                length = length > -1 ? Math.max(length, 1) : length;
                _context4.next = 11;
                return EntryIO.fetchParallel(ipfs, entryCids, length, exclude, null, null, onProgressCallback);

              case 11:
                entries = _context4.sent;
                // Cap the result at the right size by taking the last n entries,
                // or if given length is -1, then take all
                sliced = length > -1 ? last(entries, length) : entries;
                return _context4.abrupt("return", {
                  values: sliced
                });

              case 14:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function fromEntryCid(_x7, _x8) {
        return _fromEntryCid.apply(this, arguments);
      }

      return fromEntryCid;
    }()
  }, {
    key: "fromJSON",
    value: function () {
      var _fromJSON = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee5(ipfs, json) {
        var length,
            timeout,
            onProgressCallback,
            headCids,
            entries,
            finalEntries,
            _args5 = arguments;
        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                length = _args5.length > 2 && _args5[2] !== undefined ? _args5[2] : -1;
                timeout = _args5.length > 3 ? _args5[3] : undefined;
                onProgressCallback = _args5.length > 4 ? _args5[4] : undefined;

                if (isDefined(ipfs)) {
                  _context5.next = 5;
                  break;
                }

                throw LogError.IPFSNotDefinedError();

              case 5:
                json.heads.forEach(Entry.ensureInterop);
                headCids = json.heads.map(function (e) {
                  return e.cid;
                });
                _context5.next = 9;
                return EntryIO.fetchParallel(ipfs, headCids, length, [], 16, timeout, onProgressCallback);

              case 9:
                entries = _context5.sent;
                finalEntries = entries.slice().sort(Entry.compare);
                return _context5.abrupt("return", {
                  id: json.id,
                  values: finalEntries,
                  heads: json.heads
                });

              case 12:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function fromJSON(_x9, _x10) {
        return _fromJSON.apply(this, arguments);
      }

      return fromJSON;
    }()
    /**
     * Create a new log starting from an entry.
     * @param {IPFS} ipfs An IPFS instance
     * @param {Entry|Array<Entry>} sourceEntries An entry or an array of entries to fetch a log from
     * @param {number} [length=-1] How many entries to include
     * @param {Array<Entry>} [exclude] Entries to not fetch (cached)
     * @param {function(cid, entry, parent, depth)} [onProgressCallback]
     * @returns {Promise<Log>}
     */

  }, {
    key: "fromEntry",
    value: function () {
      var _fromEntry = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee6(ipfs, sourceEntries) {
        var length,
            exclude,
            onProgressCallback,
            hashes,
            entries,
            combined,
            uniques,
            sliced,
            missingSourceEntries,
            replaceInFront,
            result,
            _args6 = arguments;
        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                length = _args6.length > 2 && _args6[2] !== undefined ? _args6[2] : -1;
                exclude = _args6.length > 3 ? _args6[3] : undefined;
                onProgressCallback = _args6.length > 4 ? _args6[4] : undefined;

                if (isDefined(ipfs)) {
                  _context6.next = 5;
                  break;
                }

                throw LogError.IPFSNotDefinedError();

              case 5:
                if (isDefined(sourceEntries)) {
                  _context6.next = 7;
                  break;
                }

                throw new Error("'sourceEntries' must be defined");

              case 7:
                if (!(!Array.isArray(sourceEntries) && !Entry.isEntry(sourceEntries))) {
                  _context6.next = 9;
                  break;
                }

                throw new Error("'sourceEntries' argument must be an array of Entry instances or a single Entry");

              case 9:
                if (!Array.isArray(sourceEntries)) {
                  sourceEntries = [sourceEntries];
                }

                sourceEntries.forEach(Entry.ensureInterop); // Fetch given length, return size at least the given input entries

                length = length > -1 ? Math.max(length, sourceEntries.length) : length; // Make sure we pass cids instead of objects to the fetcher function

                hashes = sourceEntries.map(function (e) {
                  return e.cid;
                }); // Fetch the entries

                _context6.next = 15;
                return EntryIO.fetchParallel(ipfs, hashes, length, exclude, null, null, onProgressCallback);

              case 15:
                entries = _context6.sent;
                // Combine the fetches with the source entries and take only uniques
                combined = sourceEntries.concat(entries);
                uniques = findUniques(combined, 'cid').sort(Entry.compare); // Cap the result at the right size by taking the last n entries

                sliced = uniques.slice(length > -1 ? -length : -uniques.length); // Make sure that the given input entries are present in the result
                // in order to not lose references

                missingSourceEntries = difference(sliced, sourceEntries, 'cid');

                replaceInFront = function replaceInFront(a, withEntries) {
                  var sliced = a.slice(withEntries.length, a.length);
                  return withEntries.concat(sliced);
                }; // Add the input entries at the beginning of the array and remove
                // as many elements from the array before inserting the original entries


                result = replaceInFront(sliced, missingSourceEntries);
                return _context6.abrupt("return", {
                  id: result[result.length - 1].id,
                  values: result
                });

              case 23:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function fromEntry(_x11, _x12) {
        return _fromEntry.apply(this, arguments);
      }

      return fromEntry;
    }()
  }]);
  return LogIO;
}();

module.exports = LogIO;