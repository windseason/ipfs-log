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

var multihashing = require('multihashing-async');
var mh = require('multihashes');

var defaultHashAlg = 'sha2-256';

var defaultFormat = { format: 'dag-cbor', hashAlg: defaultHashAlg

  /* ImmutableDB using IPLD (through IPFS) */
};
var IPLDStore = function () {
  function IPLDStore(ipfs) {
    (0, _classCallCheck3.default)(this, IPLDStore);

    // super()
    this._ipfs = ipfs;
  }

  (0, _createClass3.default)(IPLDStore, [{
    key: 'put',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(value) {
        var cid;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this._ipfs.dag.put(value, defaultFormat);

              case 2:
                cid = _context.sent;
                return _context.abrupt('return', cid.toBaseEncodedString());

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function put(_x) {
        return _ref.apply(this, arguments);
      }

      return put;
    }()
  }, {
    key: 'get',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(key) {
        var result;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this._ipfs.dag.get(key);

              case 2:
                result = _context2.sent;
                return _context2.abrupt('return', result.value);

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function get(_x2) {
        return _ref2.apply(this, arguments);
      }

      return get;
    }()
  }]);
  return IPLDStore;
}();

var createMultihash = function createMultihash(data, hashAlg) {
  return new _promise2.default(function (resolve, reject) {
    multihashing(data, hashAlg || defaultHashAlg, function (err, multihash) {
      if (err) return reject(err);

      resolve(mh.toB58String(multihash));
    });
  });
};

// const LRU = require('lru')
// const ImmutableDB = require('./immutabledb-interface')
// const createMultihash = require('./create-multihash')

/* Memory store using an LRU cache */

var MemStore = function () {
  function MemStore() {
    (0, _classCallCheck3.default)(this, MemStore);

    this._store = {}; //new LRU(1000)
  }

  (0, _createClass3.default)(MemStore, [{
    key: 'put',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(value) {
        var data, hash;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                data = value; //new Buffer(JSON.stringify(value))
                // const hash = "MEM" + Math.floor(Math.random() * 100000000)

                hash = "MEM" + (Math.random() * 100000000).toString
                // const hash = await createMultihash(data)
                // console.log(this._store)
                // this._store.set(hash, data)
                ();
                if (!this._store) this._store = {};
                // console.log(this._store)
                // console.log(hash, data)
                this._store[hash] = data;
                // return hash
                return _context3.abrupt('return', _promise2.default.resolve({
                  toJSON: function toJSON() {
                    return {
                      data: value,
                      multihash: hash
                    };
                  }
                }));

              case 5:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function put(_x3) {
        return _ref3.apply(this, arguments);
      }

      return put;
    }()
  }, {
    key: 'get',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(key) {
        var _this = this;

        var data;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                // const data = this._store.get(key)
                data = this._store[key];

                // if (data) {
                //   const value = JSON.parse(data)
                //   return value
                // }

                // return data

                return _context4.abrupt('return', _promise2.default.resolve({
                  toJSON: function toJSON() {
                    return {
                      data: _this._store[key],
                      multihash: key
                    };
                  }
                }));

              case 2:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function get(_x4) {
        return _ref4.apply(this, arguments);
      }

      return get;
    }()
  }]);
  return MemStore;
}();

module.exports = MemStore;