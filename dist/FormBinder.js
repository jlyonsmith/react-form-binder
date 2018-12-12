"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FormBinder = void 0;

var _eventemitter = _interopRequireDefault(require("eventemitter3"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var FormBinder =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(FormBinder, _EventEmitter);

  function FormBinder(originalObj, bindingDefs, options) {
    var _this;

    _classCallCheck(this, FormBinder);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(FormBinder).call(this));
    _this._id = originalObj._id;

    if (options) {
      if (typeof options === "function") {
        _this._onAnyModified = options;
      } else {
        _this._onAnyModified = options.onAnyModified;
        _this._readOnly = options.readOnly;
        _this._metadata = options.metadata;
      }
    }

    _this._bindings = {};
    _this._originalObj = originalObj;

    for (var path in bindingDefs) {
      var bindingDef = bindingDefs[path];
      var binding = {
        isDisabled: _this._ensureFunc(bindingDef.isDisabled, false),
        isReadOnly: _this._ensureFunc(bindingDef.isReadOnly, false),
        isVisible: _this._ensureFunc(bindingDef.isVisible, true),
        noValue: !!bindingDef.noValue
      };

      if (binding.noValue) {
        binding.state = {};
      } else {
        binding.alwaysGet = bindingDef.alwaysGet;
        binding.isValid = _this._ensureFunc(bindingDef.isValid, true, true);

        var value = FormBinder._getObjectPathValue(originalObj, path);

        value = bindingDef.pre ? bindingDef.pre(value) : value;
        value = typeof value === "undefined" ? "" : value;
        binding.unmodifiedValue = value;

        binding.post = bindingDef.post || function (v) {
          return v;
        };

        binding.state = {
          value: value,
          modified: false
        };
      }

      _this._bindings[path] = binding;
    }

    _this._updateBindingAttributes();

    return _this;
  }

  _createClass(FormBinder, [{
    key: "getMetadata",
    value: function getMetadata() {
      return JSON.parse(JSON.stringify(this._metadata));
    }
  }, {
    key: "getOriginalObject",
    value: function getOriginalObject() {
      return JSON.parse(JSON.stringify(this._originalObj));
    }
  }, {
    key: "_ensureFunc",
    value: function _ensureFunc(obj, def, validator) {
      // If obj is a func and does not return bool there are problems, so we wrap it.
      if (obj) {
        if (obj.constructor === Function) {
          if (validator) {
            return function (r, v, m) {
              return !!obj(r, v, m);
            };
          } else {
            return function (r) {
              return !!obj(r);
            };
          }
        } else {
          return function () {
            return !!obj;
          };
        }
      } else {
        return function () {
          return def;
        };
      }
    }
  }, {
    key: "updateBindingValue",
    value: function updateBindingValue(path, newValue) {
      var lastAnyModified = this.anyModified;
      var binding = this._bindings[path];

      if (binding) {
        if (binding.noValue) {
          throw new Error("Attempt to update value for non-value binding '".concat(path, "'"));
        }

        binding.state.value = newValue;
        binding.state.modified = newValue !== binding.unmodifiedValue;

        this._updateBindingAttributes();

        if (lastAnyModified !== this.anyModified && this._onAnyModified) {
          this._onAnyModified(this.anyModified);
        }
      }

      return binding.state;
    }
  }, {
    key: "_updateBindingAttributes",
    value: function _updateBindingAttributes() {
      this.anyModified = false;
      this.allValid = true; // Do value bindings first

      for (var path in this._bindings) {
        var binding = this._bindings[path];

        if (binding.noValue) {
          continue;
        }

        var valid = binding.isValid(this, binding.state.value); // Only value bindings can change these two properties

        this.allValid = valid && this.allValid;
        this.anyModified = binding.state.modified || this.anyModified;
        Object.assign(binding.state, {
          valid: valid,
          disabled: binding.isDisabled(this),
          readOnly: binding.isReadOnly(this),
          visible: binding.isVisible(this)
        });
      } // Do non-value bindings second


      for (var _path in this._bindings) {
        var _binding = this._bindings[_path];

        if (!_binding.noValue) {
          continue;
        }

        var disabled = _binding.isDisabled(this);

        var readOnly = _binding.isReadOnly(this);

        var visible = _binding.isVisible(this); // Did the disabled, read-only or visible state of this binding change?


        var anyChanges = disabled !== _binding.state.disabled || readOnly !== _binding.state.readOnly || visible !== _binding.state.visible;

        if (anyChanges) {
          _binding.state = {
            disabled: disabled,
            readOnly: readOnly,
            visible: visible // Fire an event so the non-value component can update itself

          };
          this.emit(_path, {
            path: _path,
            state: _binding.state
          });
        }
      }
    }
  }, {
    key: "getBindingValue",
    value: function getBindingValue(path) {
      return this.getBindingState(path).value;
    }
  }, {
    key: "getBindingState",
    value: function getBindingState(path) {
      var binding = this._bindings[path];

      if (!binding) {
        throw new Error("There is no binding entry for '".concat(path, "'"));
      }

      return binding.state;
    }
  }, {
    key: "getDeltaObject",
    value: function getDeltaObject() {
      // Generate an object that has the modified and alwaysGet bindings
      var obj = {};

      if (!this.anyModified && !this.allValid) {
        return obj;
      } // Will have an _id if updating


      if (this._id) {
        obj._id = this._id;
      }

      for (var path in this._bindings) {
        var binding = this._bindings[path];

        if (binding.alwaysGet || !binding.noValue && binding.state.modified) {
          var value = binding.state.value;

          if (value && value.constructor === "String") {
            value = value.trim();

            if (value === binding.unmodifiedValue) {
              continue;
            }
          }

          value = binding.post ? binding.post(value) : value;

          FormBinder._setObjectPathValue(obj, path, value);
        }
      }

      return obj;
    }
  }, {
    key: "id",
    get: function get() {
      return this._id;
    }
  }, {
    key: "readOnly",
    get: function get() {
      return this._readOnly;
    }
  }], [{
    key: "_getObjectPathValue",
    value: function _getObjectPathValue(obj, path) {
      path.split(".").forEach(function (namePart) {
        if (obj) {
          obj = obj[namePart];
        }
      });
      return obj;
    }
  }, {
    key: "_setObjectPathValue",
    value: function _setObjectPathValue(obj, path, value) {
      path.split(".").forEach(function (namePart, i, nameParts) {
        if (i < nameParts.length - 1) {
          if (!obj[namePart]) {
            obj[namePart] = {};
          }

          obj = obj[namePart];
        } else {
          obj[namePart] = value;
        }
      });
    }
  }]);

  return FormBinder;
}(_eventemitter.default);

exports.FormBinder = FormBinder;
//# sourceMappingURL=FormBinder.js.map