'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var pWhilst = require('p-whilst');

var pMap = require('p-map');

var Entry = require('./entry');

var EntryIO =
/*#__PURE__*/
function () {
  function EntryIO() {
    (0, _classCallCheck2.default)(this, EntryIO);
  }

  (0, _createClass2.default)(EntryIO, null, [{
    key: "fetchParallel",
    // Fetch log graphs in parallel
    value: function () {
      var _fetchParallel = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(ipfs, hashes, length) {
        var exclude,
            concurrency,
            timeout,
            onProgressCallback,
            fetchOne,
            concatArrays,
            flatten,
            entries,
            _args = arguments;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                exclude = _args.length > 3 && _args[3] !== undefined ? _args[3] : [];
                concurrency = _args.length > 4 ? _args[4] : undefined;
                timeout = _args.length > 5 ? _args[5] : undefined;
                onProgressCallback = _args.length > 6 ? _args[6] : undefined;

                fetchOne = function fetchOne(hash) {
                  return EntryIO.fetchAll(ipfs, hash, length, exclude, timeout, onProgressCallback);
                };

                concatArrays = function concatArrays(arr1, arr2) {
                  return arr1.concat(arr2);
                };

                flatten = function flatten(arr) {
                  return arr.reduce(concatArrays, []);
                };

                concurrency = Math.max(concurrency || hashes.length, 1);
                _context.next = 10;
                return pMap(hashes, fetchOne, {
                  concurrency: concurrency
                });

              case 10:
                entries = _context.sent;
                return _context.abrupt("return", flatten(entries));

              case 12:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function fetchParallel(_x, _x2, _x3) {
        return _fetchParallel.apply(this, arguments);
      }

      return fetchParallel;
    }()
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

  }, {
    key: "fetchAll",
    value: function () {
      var _fetchAll = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee3(ipfs, hashes, amount) {
        var exclude,
            timeout,
            onProgressCallback,
            result,
            cache,
            loadingQueue,
            addToLoadingQueue,
            addToExcludeCache,
            shouldFetchMore,
            fetchEntry,
            _args3 = arguments;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                exclude = _args3.length > 3 && _args3[3] !== undefined ? _args3[3] : [];
                timeout = _args3.length > 4 && _args3[4] !== undefined ? _args3[4] : null;
                onProgressCallback = _args3.length > 5 ? _args3[5] : undefined;
                result = [];
                cache = {};
                loadingQueue = Array.isArray(hashes) ? hashes.slice() : [hashes]; // Add a multihash to the loading queue

                addToLoadingQueue = function addToLoadingQueue(e) {
                  return loadingQueue.push(e);
                }; // Add entries that we don't need to fetch to the "cache"


                exclude = exclude && Array.isArray(exclude) ? exclude : [];

                addToExcludeCache = function addToExcludeCache(e) {
                  return cache[e.hash] = e;
                };

                exclude.forEach(addToExcludeCache);

                shouldFetchMore = function shouldFetchMore() {
                  return loadingQueue.length > 0 && (result.length < amount || amount < 0);
                };

                fetchEntry = function fetchEntry() {
                  var hash = loadingQueue.shift();

                  if (cache[hash]) {
                    return Promise.resolve();
                  }

                  return new Promise(
                  /*#__PURE__*/
                  function () {
                    var _ref = (0, _asyncToGenerator2.default)(
                    /*#__PURE__*/
                    _regenerator.default.mark(function _callee2(resolve, reject) {
                      var timer, addToResults, entry;
                      return _regenerator.default.wrap(function _callee2$(_context2) {
                        while (1) {
                          switch (_context2.prev = _context2.next) {
                            case 0:
                              // Resolve the promise after a timeout (if given) in order to
                              // not get stuck loading a block that is unreachable
                              timer = timeout ? setTimeout(function () {
                                console.warn("Warning: Couldn't fetch entry '".concat(hash, "', request timed out (").concat(timeout, "ms)"));
                                resolve();
                              }, timeout) : null;

                              addToResults = function addToResults(entry) {
                                clearTimeout(timer);

                                if (Entry.isEntry(entry)) {
                                  entry.next.forEach(addToLoadingQueue);
                                  result.push(entry);
                                  cache[hash] = entry;

                                  if (onProgressCallback) {
                                    onProgressCallback(hash, entry, result.length);
                                  }
                                }
                              }; // Load the entry


                              _context2.prev = 2;
                              _context2.next = 5;
                              return Entry.fromMultihash(ipfs, hash);

                            case 5:
                              entry = _context2.sent;
                              addToResults(entry);
                              resolve();
                              _context2.next = 13;
                              break;

                            case 10:
                              _context2.prev = 10;
                              _context2.t0 = _context2["catch"](2);
                              reject(_context2.t0);

                            case 13:
                            case "end":
                              return _context2.stop();
                          }
                        }
                      }, _callee2, this, [[2, 10]]);
                    }));

                    return function (_x7, _x8) {
                      return _ref.apply(this, arguments);
                    };
                  }());
                };

                _context3.next = 14;
                return pWhilst(shouldFetchMore, fetchEntry);

              case 14:
                return _context3.abrupt("return", result);

              case 15:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function fetchAll(_x4, _x5, _x6) {
        return _fetchAll.apply(this, arguments);
      }

      return fetchAll;
    }()
  }]);
  return EntryIO;
}();

module.exports = EntryIO;