'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

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
var pDoWhilst = require('p-do-whilst');
var Entry = require('./entry');

var EntryIO = function () {
  function EntryIO() {
    (0, _classCallCheck3.default)(this, EntryIO);
  }

  (0, _createClass3.default)(EntryIO, null, [{
    key: 'fetchParallel',

    // Fetch log graphs in parallel
    value: function fetchParallel(ipfs, hashes, length) {
      var exclude = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
      var concurrency = arguments[4];
      var timeout = arguments[5];
      var onProgressCallback = arguments[6];

      var fetchOne = function fetchOne(hash) {
        return EntryIO.fetchAll(ipfs, hash, length, exclude, timeout, onProgressCallback);
      };
      var concatArrays = function concatArrays(arr1, arr2) {
        return arr1.concat(arr2);
      };
      var flatten = function flatten(arr) {
        return arr.reduce(concatArrays, []);
      };
      return pMap(hashes, fetchOne, { concurrency: Math.max(concurrency || hashes.length, 1) }).then(flatten // Flatten the results
      );
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

  }, {
    key: 'fetchAll',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(ipfs, hashes, amount) {
        var exclude = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
        var timeout = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
        var onProgressCallback = arguments[5];
        var onStartProgressCallback = arguments[6];

        var _this = this;

        var concurrency = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 32;
        var delay = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 0;

        var result, cache, loadingCache, loadingQueue, addToLoadingQueue, addToExcludeCache, loadingQueueHasMore, shouldFetchMore, getNextFromQueue, fetchEntry, running, _processQueue;

        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                result = [];
                cache = {};
                loadingCache = {};
                loadingQueue = Array.isArray(hashes) ? { 0: hashes.slice() } : { 0: [hashes]

                  // Add a multihash to the loading queue
                };

                addToLoadingQueue = function addToLoadingQueue(e, idx) {
                  if (!loadingCache[e]) {
                    if (!loadingQueue[idx]) loadingQueue[idx] = [];
                    if (!loadingQueue[idx].includes(e)) {
                      loadingQueue[idx].push(e);
                    }
                    loadingCache[e] = idx;
                  }
                };

                // Add entries that we don't need to fetch to the "cache"


                addToExcludeCache = function addToExcludeCache(e) {
                  return cache[e.hash] = e;
                };

                exclude.forEach(addToExcludeCache);

                loadingQueueHasMore = function loadingQueueHasMore() {
                  return (0, _values2.default)(loadingQueue).find(function (e) {
                    return e && e.length > 0;
                  }) !== undefined;
                };

                shouldFetchMore = function shouldFetchMore() {
                  return loadingQueueHasMore() && (result.length < amount || amount < 0);
                };

                getNextFromQueue = function getNextFromQueue() {
                  var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

                  var all = (0, _values2.default)(loadingQueue).reduce(function (res, acc) {
                    while (acc.length > 0 && res.length < length) {
                      var e = acc.shift();
                      res.push(e);
                    }
                    return res;
                  }, []);
                  return all;
                };

                fetchEntry = function fetchEntry(entryHash) {
                  var hash = entryHash;

                  if (!hash || cache[hash]) {
                    return _promise2.default.resolve();
                  }

                  return new _promise2.default(function (resolve, reject) {
                    // Resolve the promise after a timeout (if given) in order to
                    // not get stuck loading a block that is unreachable
                    // const timer = timeout 
                    // ? setTimeout(() => {
                    //     console.warn(`Warning: Couldn't fetch entry '${hash}', request timed out (${timeout}ms)`)
                    //     resolve()
                    //   } , timeout) 
                    // : null

                    var sleep = function sleep() {
                      var ms = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
                      return new _promise2.default(function (resolve) {
                        return setTimeout(resolve, ms);
                      });
                    };

                    var addToResults = function addToResults(entry) {
                      // clearTimeout(timer)
                      if (Entry.isEntry(entry)) {
                        try {
                          entry.next.forEach(addToLoadingQueue);
                          entry.refs.forEach(addToLoadingQueue);

                          result.push(entry);
                          cache[hash] = entry;
                          if (onProgressCallback) {
                            onProgressCallback(hash, entry, result.length, result, loadingQueue);
                          }
                        } catch (e) {
                          console.error(e);
                        }
                      }
                    };

                    if (onStartProgressCallback) {
                      onStartProgressCallback(hash, null, result.length, result, loadingQueue);
                    }

                    // Load the entry
                    Entry.fromMultihash(ipfs, hash).then(addToResults).then(function () {
                      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(entry) {
                        return _regenerator2.default.wrap(function _callee$(_context) {
                          while (1) {
                            switch (_context.prev = _context.next) {
                              case 0:
                                if (!(delay > 0)) {
                                  _context.next = 3;
                                  break;
                                }

                                _context.next = 3;
                                return sleep(delay);

                              case 3:
                                return _context.abrupt('return', entry);

                              case 4:
                              case 'end':
                                return _context.stop();
                            }
                          }
                        }, _callee, _this);
                      }));

                      return function (_x11) {
                        return _ref2.apply(this, arguments);
                      };
                    }()).then(resolve).catch(function (err) {
                      resolve();
                    });
                  });
                };

                running = 0;

                _processQueue = function () {
                  var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
                    var nexts;
                    return _regenerator2.default.wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            if (!(running < concurrency)) {
                              _context2.next = 6;
                              break;
                            }

                            nexts = getNextFromQueue(concurrency);

                            running += nexts.length;
                            _context2.next = 5;
                            return pMap(nexts, fetchEntry);

                          case 5:
                            running -= nexts.length;

                          case 6:
                          case 'end':
                            return _context2.stop();
                        }
                      }
                    }, _callee2, _this);
                  }));

                  return function _processQueue() {
                    return _ref3.apply(this, arguments);
                  };
                }();

                _context4.next = 15;
                return pDoWhilst((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
                  return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          _context3.next = 2;
                          return _processQueue();

                        case 2:
                          return _context3.abrupt('return', _context3.sent);

                        case 3:
                        case 'end':
                          return _context3.stop();
                      }
                    }
                  }, _callee3, _this);
                })), shouldFetchMore

                // Free memory to avoid minor GC
                );

              case 15:
                cache = {};
                loadingCache = {};
                loadingQueue = [];

                return _context4.abrupt('return', result);

              case 19:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function fetchAll(_x6, _x7, _x8) {
        return _ref.apply(this, arguments);
      }

      return fetchAll;
    }()
  }]);
  return EntryIO;
}();

module.exports = EntryIO;