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

  function FormBinder(originalObj, bindings, onAnyModified) {
    _classCallCheck(this, FormBinder);

    var _this = _possibleConstructorReturn(this, (FormBinder.__proto__ || Object.getPrototypeOf(FormBinder)).call(this));

    _this._id = originalObj._id;
    _this._onAnyModified = onAnyModified;
    _this._fields = {};
    _this._originalObj = originalObj;

    for (var name in bindings) {
      var binding = bindings[name];
      var field = {
        isDisabled: _this._ensureFunc(binding.isDisabled, false),
        isReadOnly: _this._ensureFunc(binding.isReadOnly, false),
        isVisible: _this._ensureFunc(binding.isVisible, true),
        noValue: !!binding.noValue
      };

      if (field.noValue) {
        field.state = {};
      } else {
        field.alwaysGet = binding.alwaysGet;
        field.isValid = _this._ensureFunc(binding.isValid, true, true);

        var value = FormBinder._getObjectFieldValue(originalObj, name);

        if (typeof value === "undefined") {
          value = typeof binding.initValue !== "undefined" ? binding.initValue : "";
        }

        field.unmodifiedValue = value;
        field.post = field.post || function (v) {
          return v;
        };
        field.state = {
          value: binding.pre ? binding.pre(value) : value,
          modified: false
        };
      }

      _this._fields[name] = field;
    }

    _this._updateFieldStates();
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
    key: "updateFieldValue",
    value: function updateFieldValue(name, newValue) {
      var lastAnyModified = this.anyModified;
      var field = this._fields[name];

      if (field) {
        if (field.noValue) {
          throw new Error("Attempt to update value for non-value field '" + name + "'");
        }

        field.state.value = newValue;
        field.state.modified = newValue !== field.unmodifiedValue;

        this._updateFieldStates(field);

        if (lastAnyModified !== this.anyModified && this._onAnyModified) {
          this._onAnyModified(this.anyModified);
        }
      }

      return field.state;
    }
  }, {
    key: "_updateFieldStates",
    value: function _updateFieldStates() {
      this.anyModified = false;
      this.allValid = true;

      for (var name in this._fields) {
        var field = this._fields[name];

        // Do non-value fields after value fields and ignore any just changed field
        if (field.noValue) {
          continue;
        }

        var valid = field.isValid(this, field.state.value, field.metadata);

        // Only value fields can change these two properties
        this.allValid = valid && this.allValid;
        this.anyModified = field.state.modified || this.anyModified;

        Object.assign(field.state, {
          valid: valid,
          disabled: field.isDisabled(this),
          readOnly: field.isReadOnly(this),
          visible: field.isVisible(this)
        });
      }

      for (var _name in this._fields) {
        var _field = this._fields[_name];

        if (!_field.noValue) {
          continue;
        }

        var disabled = _field.isDisabled(this);
        var readOnly = _field.isReadOnly(this);
        var visible = _field.isVisible(this);

        // Did the valid, disabled, read-only or visible state of this field change?
        var anyChanges = disabled !== _field.state.disabled || readOnly !== _field.state.readOnly || visible !== _field.state.visible;

        if (anyChanges) {
          _field.state = {
            disabled: disabled,
            readOnly: readOnly,
            visible: visible

            // Fire an event so the component can update itself
          };this.emit(_name, { name: _name, state: _field.state });
        }
      }
    }
  }, {
    key: "getFieldValue",
    value: function getFieldValue(name) {
      return this.getFieldState(name).value;
    }
  }, {
    key: "getFieldState",
    value: function getFieldState(name) {
      var field = this._fields[name];

      if (!field) {
        throw new Error("Field '" + name + "' does not have a binding entry");
      }

      return field.state;
    }
  }, {
    key: "getModifiedFieldValues",
    value: function getModifiedFieldValues() {
      // Generate an object that has the modified and alwaysGet fields
      var obj = {};

      if (!this.anyModified && !this.allValid) {
        return obj;
      }

      // Will have an _id if updating
      if (this._id) {
        obj._id = this._id;
      }

      for (var name in this._fields) {
        var field = this._fields[name];

        if (field.alwaysGet || !field.noValue && field.state.modified) {
          var value = field.state.value;

          if (value && value.constructor === "String") {
            value = value.trim();

            if (value === field.unmodifiedValue) {
              continue;
            }
          }

          value = field.post ? field.post(value) : value;

          FormBinder._setObjectFieldValue(obj, name, value);
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
    key: "originalObj",
    get: function get() {
      return this._originalObj;
    }
  }], [{
    key: "_getObjectFieldValue",
    value: function _getObjectFieldValue(obj, name) {
      name.split(".").forEach(function (namePart) {
        if (obj) {
          obj = obj[namePart];
        }
      });
      return obj;
    }
  }, {
    key: "_setObjectFieldValue",
    value: function _setObjectFieldValue(obj, name, value) {
      name.split(".").forEach(function (namePart, i, nameParts) {
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