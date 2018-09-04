'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pWhilst = require('p-whilst');
var pMap = require('p-map');
var Entry = require('./entry');

var EntryIO = function () {
  function EntryIO() {
    (0, _classCallCheck3.default)(this, EntryIO);
  }

  (0, _createClass3.default)(EntryIO, null, [{
    key: 'fetchParallel',

    // Fetch log graphs in parallel
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(ipfs, hashes, length) {
        var exclude = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
        var concurrency = arguments[4];
        var timeout = arguments[5];
        var onProgressCallback = arguments[6];
        var fetchOne, concatArrays, flatten, entries;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
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
                _context.next = 6;
                return pMap(hashes, fetchOne, { concurrency: concurrency });

              case 6:
                entries = _context.sent;
                return _context.abrupt('return', flatten(entries));

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function fetchParallel(_x2, _x3, _x4) {
        return _ref.apply(this, arguments);
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
    key: 'fetchAll',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(ipfs, hashes, amount) {
        var exclude = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

        var _this = this;

        var timeout = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
        var onProgressCallback = arguments[5];
        var result, cache, loadingQueue, addToLoadingQueue, addToExcludeCache, shouldFetchMore, fetchEntry;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                result = [];
                cache = {};
                loadingQueue = Array.isArray(hashes) ? hashes.slice() : [hashes];

                // Add a multihash to the loading queue

                addToLoadingQueue = function addToLoadingQueue(e) {
                  return loadingQueue.push(e);
                };

                // Add entries that we don't need to fetch to the "cache"


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
                    return _promise2.default.resolve();
                  }

                  return new _promise2.default(function () {
                    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(resolve, reject) {
                      var timer, addToResults, entry;
                      return _regenerator2.default.wrap(function _callee2$(_context2) {
                        while (1) {
                          switch (_context2.prev = _context2.next) {
                            case 0:
                              // Resolve the promise after a timeout (if given) in order to
                              // not get stuck loading a block that is unreachable
                              timer = timeout ? setTimeout(function () {
                                console.warn('Warning: Couldn\'t fetch entry \'' + hash + '\', request timed out (' + timeout + 'ms)');
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
                              };

                              // Load the entry


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
                              _context2.t0 = _context2['catch'](2);

                              reject(_context2.t0);

                            case 13:
                            case 'end':
                              return _context2.stop();
                          }
                        }
                      }, _callee2, _this, [[2, 10]]);
                    }));

                    return function (_x10, _x11) {
                      return _ref3.apply(this, arguments);
                    };
                  }());
                };

                _context3.next = 11;
                return pWhilst(shouldFetchMore, fetchEntry);

              case 11:
                return _context3.abrupt('return', result);

              case 12:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function fetchAll(_x7, _x8, _x9) {
        return _ref2.apply(this, arguments);
      }

      return fetchAll;
    }()
  }]);
  return EntryIO;
}();

module.exports = EntryIO;