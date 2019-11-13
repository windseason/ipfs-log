'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var Clock = require('./lamport-clock');

var _require = require('./utils'),
    isDefined = _require.isDefined,
    io = _require.io;

var stringify = require('json-stringify-deterministic');

var IPLD_LINKS = ['next'];

var IpfsNotDefinedError = function IpfsNotDefinedError() {
  return new Error('Ipfs instance not defined');
};

var writeFormats = {
  0: 'dag-pb',
  1: 'dag-cbor'
};

var Entry =
/*#__PURE__*/
function () {
  function Entry() {
    (0, _classCallCheck2.default)(this, Entry);
  }

  (0, _createClass2.default)(Entry, null, [{
    key: "create",

    /**
     * Create an Entry
     * @param {IPFS} ipfs An IPFS instance
     * @param {Identity} identity The identity instance
     * @param {string} logId The unique identifier for this log
     * @param {*} data Data of the entry to be added. Can be any JSON.stringifyable data
     * @param {Array<string|Entry>} [next=[]] Parent hashes or entries
     * @param {LamportClock} [clock] The lamport clock
     * @returns {Promise<Entry>}
     * @example
     * const entry = await Entry.create(ipfs, identity, 'hello')
     * console.log(entry)
     * // { hash: null, payload: "hello", next: [] }
     */
    value: function () {
      var _create = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(ipfs, identity, identityProvider, keystore, logId, data) {
        var next,
            clock,
            toEntry,
            nexts,
            entry,
            signature,
            _args = arguments;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                next = _args.length > 6 && _args[6] !== undefined ? _args[6] : [];
                clock = _args.length > 7 ? _args[7] : undefined;

                if (isDefined(ipfs)) {
                  _context.next = 4;
                  break;
                }

                throw IpfsNotDefinedError();

              case 4:
                if (isDefined(identity)) {
                  _context.next = 6;
                  break;
                }

                throw new Error('identity is required, cannot create entry');

              case 6:
                if (isDefined(identityProvider)) {
                  _context.next = 8;
                  break;
                }

                throw new Error('identityProvider is required, cannot create entry');

              case 8:
                if (isDefined(keystore)) {
                  _context.next = 10;
                  break;
                }

                throw new Error('keystore is required, cannot create entry');

              case 10:
                if (isDefined(logId)) {
                  _context.next = 12;
                  break;
                }

                throw new Error('Entry requires an id');

              case 12:
                if (isDefined(data)) {
                  _context.next = 14;
                  break;
                }

                throw new Error('Entry requires data');

              case 14:
                if (!(!isDefined(next) || !Array.isArray(next))) {
                  _context.next = 16;
                  break;
                }

                throw new Error("'next' argument is not an array");

              case 16:
                // Clean the next objects and convert to hashes
                toEntry = function toEntry(e) {
                  return e.hash ? e.hash : e;
                };

                nexts = next.filter(isDefined).map(toEntry);
                entry = {
                  hash: null,
                  // "zd...Foo", we'll set the hash after persisting the entry
                  id: logId,
                  // For determining a unique chain
                  payload: data,
                  // Can be any JSON.stringifyable data
                  next: nexts,
                  // Array of hashes
                  v: 1,
                  // To tag the version of this data structure
                  clock: clock || new Clock(identity.publicKey)
                };
                _context.next = 21;
                return identityProvider.sign(identity, Entry.toBuffer(entry), keystore);

              case 21:
                signature = _context.sent;
                entry.key = identity.publicKey;
                entry.identity = identity.toJSON();
                entry.sig = signature;
                _context.next = 27;
                return Entry.toMultihash(ipfs, entry);

              case 27:
                entry.hash = _context.sent;
                return _context.abrupt("return", entry);

              case 29:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function create(_x, _x2, _x3, _x4, _x5, _x6) {
        return _create.apply(this, arguments);
      }

      return create;
    }()
  }, {
    key: "toEntry",
    value: function () {
      var _toEntry = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee2(e) {
        var entry;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                entry = {
                  hash: null,
                  // "zd...Foo", we'll set the hash after persisting the entry
                  id: e.id,
                  // For determining a unique chain
                  payload: e.payload,
                  // Can be any JSON.stringifyable data
                  next: e.next,
                  // Array of hashes
                  v: e.v,
                  // To tag the version of this data structure
                  clock: e.clock
                };
                entry.key = e.key;

                if (e.identity) {
                  entry.identity = e.identity;
                }

                entry.sig = e.sig;
                return _context2.abrupt("return", entry);

              case 5:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function toEntry(_x7) {
        return _toEntry.apply(this, arguments);
      }

      return toEntry;
    }()
    /**
     * Verifies an entry signature.
     *
     * @param {IdentityProvider} identityProvider The identity provider to use
     * @param {Entry} entry The entry being verified
     * @return {Promise} A promise that resolves to a boolean value indicating if the signature is valid
     */

  }, {
    key: "verify",
    value: function () {
      var _verify = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee3(entry, keystore) {
        var e;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (Entry.isEntry(entry)) {
                  _context3.next = 2;
                  break;
                }

                throw new Error('Invalid Log entry');

              case 2:
                if (keystore) {
                  _context3.next = 4;
                  break;
                }

                throw new Error('keystore is required, cannot verify entry');

              case 4:
                if (entry.key) {
                  _context3.next = 6;
                  break;
                }

                throw new Error("Entry doesn't have a key");

              case 6:
                if (entry.sig) {
                  _context3.next = 8;
                  break;
                }

                throw new Error("Entry doesn't have a signature");

              case 8:
                e = {
                  hash: null,
                  id: entry.id,
                  payload: entry.payload,
                  next: entry.next,
                  v: entry.v,
                  clock: entry.clock
                };
                return _context3.abrupt("return", keystore.verify(entry.sig, entry.key, Entry.toBuffer(e), 'v' + entry.v));

              case 10:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function verify(_x8, _x9) {
        return _verify.apply(this, arguments);
      }

      return verify;
    }()
    /**
     * Transforms an entry into a Buffer.
     * @param {Entry} entry The entry
     * @return {Buffer} The buffer
     */

  }, {
    key: "toBuffer",
    value: function toBuffer(entry) {
      var stringifiedEntry = entry.v === 0 ? JSON.stringify(entry) : stringify(entry);
      return Buffer.from(stringifiedEntry);
    }
    /**
     * Get the multihash of an Entry.
     * @param {IPFS} ipfs An IPFS instance
     * @param {Entry} entry Entry to get a multihash for
     * @returns {Promise<string>}
     * @example
     * const multihash = await Entry.toMultihash(ipfs, entry)
     * console.log(multihash)
     * // "Qm...Foo"
     * @deprecated
     */

  }, {
    key: "toMultihash",
    value: function () {
      var _toMultihash = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee4(ipfs, entry) {
        var e;
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (ipfs) {
                  _context4.next = 2;
                  break;
                }

                throw IpfsNotDefinedError();

              case 2:
                if (Entry.isEntry(entry)) {
                  _context4.next = 4;
                  break;
                }

                throw new Error('Invalid object format, cannot generate entry hash');

              case 4:
                // Ensure `entry` follows the correct format
                e = {
                  hash: null,
                  id: entry.id,
                  payload: entry.payload,
                  next: entry.next,
                  v: entry.v,
                  clock: entry.clock
                };
                if (entry.key) Object.assign(e, {
                  key: entry.key
                });
                if (entry.identity) Object.assign(e, {
                  identity: entry.identity
                });
                if (entry.sig) Object.assign(e, {
                  sig: entry.sig
                });
                return _context4.abrupt("return", io.write(ipfs, writeFormats[e.v], e, {
                  links: IPLD_LINKS
                }));

              case 9:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function toMultihash(_x10, _x11) {
        return _toMultihash.apply(this, arguments);
      }

      return toMultihash;
    }()
    /**
     * Create an Entry from a hash.
     * @param {IPFS} ipfs An IPFS instance
     * @param {string} hash The hash to create an Entry from
     * @returns {Promise<Entry>}
     * @example
     * const entry = await Entry.fromMultihash(ipfs, "zd...Foo")
     * console.log(entry)
     * // { hash: "Zd...Foo", payload: "hello", next: [] }
     */

  }, {
    key: "fromMultihash",
    value: function () {
      var _fromMultihash = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee5(ipfs, hash) {
        var e, entry;
        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (ipfs) {
                  _context5.next = 2;
                  break;
                }

                throw IpfsNotDefinedError();

              case 2:
                if (hash) {
                  _context5.next = 4;
                  break;
                }

                throw new Error("Invalid hash: ".concat(hash));

              case 4:
                _context5.next = 6;
                return io.read(ipfs, hash, {
                  links: IPLD_LINKS
                });

              case 6:
                e = _context5.sent;
                entry = {
                  hash: hash,
                  id: e.id,
                  payload: e.payload,
                  next: e.next,
                  v: e.v,
                  clock: new Clock(e.clock.id, e.clock.time)
                };
                if (e.key) Object.assign(entry, {
                  key: e.key
                });
                if (e.identity) Object.assign(entry, {
                  identity: e.identity
                });
                if (e.sig) Object.assign(entry, {
                  sig: e.sig
                });
                return _context5.abrupt("return", entry);

              case 12:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      function fromMultihash(_x12, _x13) {
        return _fromMultihash.apply(this, arguments);
      }

      return fromMultihash;
    }()
    /**
     * Check if an object is an Entry.
     * @param {Entry} obj
     * @returns {boolean}
     */

  }, {
    key: "isEntry",
    value: function isEntry(obj) {
      return obj && obj.id !== undefined && obj.next !== undefined && obj.payload !== undefined && obj.v !== undefined && obj.hash !== undefined && obj.clock !== undefined;
    }
    /**
     * Compares two entries.
     * @param {Entry} a
     * @param {Entry} b
     * @returns {number} 1 if a is greater, -1 is b is greater
     */

  }, {
    key: "compare",
    value: function compare(a, b) {
      var distance = Clock.compare(a.clock, b.clock);
      if (distance === 0) return a.clock.id < b.clock.id ? -1 : 1;
      return distance;
    }
    /**
     * Check if an entry equals another entry.
     * @param {Entry} a
     * @param {Entry} b
     * @returns {boolean}
     */

  }, {
    key: "isEqual",
    value: function isEqual(a, b) {
      return a.hash === b.hash;
    }
    /**
     * Check if an entry is a parent to another entry.
     * @param {Entry} entry1 Entry to check
     * @param {Entry} entry2 The parent Entry
     * @returns {boolean}
     */

  }, {
    key: "isParent",
    value: function isParent(entry1, entry2) {
      return entry2.next.indexOf(entry1.hash) > -1;
    }
    /**
     * Find entry's children from an Array of entries.
     * Returns entry's children as an Array up to the last know child.
     * @param {Entry} entry Entry for which to find the parents
     * @param {Array<Entry>} values Entries to search parents from
     * @returns {Array<Entry>}
     */

  }, {
    key: "findChildren",
    value: function findChildren(entry, values) {
      var stack = [];
      var parent = values.find(function (e) {
        return Entry.isParent(entry, e);
      });
      var prev = entry;

      while (parent) {
        stack.push(parent);
        prev = parent;
        parent = values.find(function (e) {
          return Entry.isParent(prev, e);
        });
      }

      stack = stack.sort(function (a, b) {
        return a.clock.time > b.clock.time;
      });
      return stack;
    }
  }]);
  return Entry;
}();

module.exports = Entry;