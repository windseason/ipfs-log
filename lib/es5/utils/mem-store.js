'use strict';

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MemStore = function () {
  function MemStore() {
    (0, _classCallCheck3.default)(this, MemStore);

    this._store = {};
  }

  (0, _createClass3.default)(MemStore, [{
    key: "put",
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(data) {
        var hash;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                hash = "MEM" + (Math.random() * 100000000).toString
                // const hash = await createMultihash(data)
                ();
                if (!this._store) this._store = {};
                this._store[hash] = data;
                return _context.abrupt("return", _promise2.default.resolve({
                  toJSON: function toJSON() {
                    return {
                      data: data,
                      multihash: hash
                    };
                  }
                }));

              case 4:
              case "end":
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
    key: "get",
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(key) {
        var _this = this;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt("return", _promise2.default.resolve({
                  toJSON: function toJSON() {
                    return {
                      data: _this._store[key],
                      multihash: key
                    };
                  }
                }));

              case 1:
              case "end":
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
  return MemStore;
}();

module.exports = MemStore;