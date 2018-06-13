"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FormBinder = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventemitter = require("eventemitter3");

var _eventemitter2 = _interopRequireDefault(_eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FormBinder = exports.FormBinder = function (_EventEmitter) {
  _inherits(FormBinder, _EventEmitter);

  function FormBinder(originalObj, bindingDefs, options) {
    _classCallCheck(this, FormBinder);

    var _this = _possibleConstructorReturn(this, (FormBinder.__proto__ || Object.getPrototypeOf(FormBinder)).call(this));

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

        if (typeof value === "undefined") {
          value = typeof bindingDef.initValue !== "undefined" ? bindingDef.initValue : "";
        }

        value = bindingDef.pre ? bindingDef.pre(value) : value;

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

    _this._updateBindingStates();
    return _this;
  }

  _createClass(FormBinder, [{
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
          throw new Error("Attempt to update value for non-value binding '" + path + "'");
        }

        binding.state.value = newValue;
        binding.state.modified = newValue !== binding.unmodifiedValue;

        this._updateBindingStates(binding);

        if (lastAnyModified !== this.anyModified && this._onAnyModified) {
          this._onAnyModified(this.anyModified);
        }
      }

      return binding.state;
    }
  }, {
    key: "_updateBindingStates",
    value: function _updateBindingStates() {
      this.anyModified = false;
      this.allValid = true;

      for (var path in this._bindings) {
        var binding = this._bindings[path];

        // Do non-value bindings after value bindings and ignore any just changed binding
        if (binding.noValue) {
          continue;
        }

        var valid = binding.isValid(this, binding.state.value);

        // Only value bindings can change these two properties
        this.allValid = valid && this.allValid;
        this.anyModified = binding.state.modified || this.anyModified;

        Object.assign(binding.state, {
          valid: valid,
          disabled: binding.isDisabled(this),
          readOnly: binding.isReadOnly(this),
          visible: binding.isVisible(this)
        });
      }

      for (var _path in this._bindings) {
        var _binding = this._bindings[_path];

        if (!_binding.noValue) {
          continue;
        }

        var disabled = _binding.isDisabled(this);
        var readOnly = _binding.isReadOnly(this);
        var visible = _binding.isVisible(this);

        // Did the valid, disabled, read-only or visible state of this binding change?
        var anyChanges = disabled !== _binding.state.disabled || readOnly !== _binding.state.readOnly || visible !== _binding.state.visible;

        if (anyChanges) {
          _binding.state = {
            disabled: disabled,
            readOnly: readOnly,
            visible: visible

            // Fire an event so the component can update itself
          };this.emit(_path, { path: _path, state: _binding.state });
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
        throw new Error("There is no binding entry for '" + path + "'");
      }

      return binding.state;
    }
  }, {
    key: "getModifiedBindingValues",
    value: function getModifiedBindingValues() {
      // Generate an object that has the modified and alwaysGet bindings
      var obj = {};

      if (!this.anyModified && !this.allValid) {
        return obj;
      }

      // Will have an _id if updating
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
  }, {
    key: "metadata",
    get: function get() {
      return this._metadata;
    }
  }, {
    key: "originalObj",
    get: function get() {
      return this._originalObj;
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
}(_eventemitter2.default);
//# sourceMappingURL=FormBinder.js.map