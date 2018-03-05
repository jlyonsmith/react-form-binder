'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FormBinder = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventemitter = require('eventemitter3');

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

    _this._updateFieldValue = _this._updateFieldValue.bind(_this);
    _this._id = originalObj._id;
    _this.onAnyModified = onAnyModified;
    _this.fields = {};
    _this.noValueFields = {};

    for (var name in bindings) {
      var binding = bindings[name];
      var field = {
        isDisabled: _this.ensureFunc(binding.isDisabled, false),
        isReadOnly: _this.ensureFunc(binding.isReadOnly, false),
        isVisible: _this.ensureFunc(binding.isVisible, true),
        noValue: !!binding.noValue
      };

      if (field.noValue) {
        field.state = {
          disabled: field.isDisabled(_this),
          readOnly: field.isReadOnly(_this),
          visible: field.isVisible(_this)
        };
      } else {
        field.alwaysGet = binding.alwaysGet;
        field.isValid = _this.ensureFunc(binding.isValid, true);
        field.initValue = binding.initValue === undefined ? '' : binding.initValue;
        field.originalValue = FormBinder.getObjectFieldValue(originalObj, name);
        _this._updateFieldValue(field, field.originalValue || field.initValue);
      }
      _this.fields[name] = field;
    }

    _this._updateOtherFields();
    return _this;
  }

  _createClass(FormBinder, [{
    key: 'ensureFunc',
    value: function ensureFunc(obj, def) {
      // If obj is a func and does not return bool there are problems. So we wrap.
      return obj ? obj.constructor === Function ? function (r, v) {
        return !!obj(r, v);
      } : function () {
        return !!obj;
      } : function () {
        return def;
      };
    }
  }, {
    key: 'updateFieldValue',
    value: function updateFieldValue(name, newValue, meta) {
      var lastAnyModified = this.anyModified;
      var field = this.fields[name];

      if (field) {
        this._updateFieldValue(field, newValue, meta);
        this._updateOtherFields(field);
        if (lastAnyModified !== this.anyModified && this.onAnyModified) {
          this.onAnyModified(this.anyModified);
        }
      }

      return field.state;
    }
  }, {
    key: '_updateFieldValue',
    value: function _updateFieldValue(field, newValue) {
      field.state = {
        value: newValue,
        disabled: field.isDisabled(this),
        readOnly: field.isReadOnly(this),
        visible: field.isVisible(this),
        valid: field.isValid(this, newValue),
        modified: field.originalValue !== undefined ? field.originalValue !== newValue : newValue !== field.initValue
      };
    }
  }, {
    key: '_updateOtherFields',
    value: function _updateOtherFields(changedField) {
      if (changedField) {
        this.anyModified = changedField.state.modified;
        this.allValid = changedField.state.valid;
      } else {
        this.anyModified = false;
        this.allValid = true;
      }

      for (var name in this.fields) {
        var field = this.fields[name];

        if (changedField === field) {
          continue;
        }

        var valid = undefined;

        if (!field.noValue) {
          valid = field.isValid(this, field.state.value);

          this.allValid = valid && this.allValid;
          this.anyModified = field.state.modified || this.anyModified;
        }

        var disabled = field.isDisabled(this);
        var readOnly = field.isReadOnly(this);
        var visible = field.isVisible(this);

        // Did the valid, disabled, read-only or visible state of this field change?
        var anyChanges = valid !== field.state.valid || disabled !== field.state.disabled || readOnly !== field.state.readOnly || visible !== field.state.visible;

        if (anyChanges) {
          field.state = {
            valid: valid,
            disabled: disabled,
            readOnly: readOnly,
            visible: visible,
            modified: field.state.modified,
            value: field.state.value
            // Fire an event so the component can update itself
          };this.emit(name, { name: name, state: field.state });
        }
      }
    }
  }, {
    key: 'getFieldValue',
    value: function getFieldValue(name) {
      return this.getFieldState(name).value;
    }
  }, {
    key: 'getFieldState',
    value: function getFieldState(name) {
      var field = this.fields[name] || this.noValueFields[name];

      if (!field) {
        throw new Error('Field \'' + name + '\' does not have a binding entry');
      }

      return field.state;
    }
  }, {
    key: 'getModifiedFieldValues',
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

      for (var name in this.fields) {
        var field = this.fields[name];

        if (field.alwaysGet || !field.noValue && field.state.modified) {
          var value = field.state.value;

          if (value && value.constructor === 'String') {
            value = value.trim();
          }
          FormBinder.setObjectFieldValue(obj, name, value);
        }
      }

      return obj;
    }
  }, {
    key: 'getOriginalFieldValues',
    value: function getOriginalFieldValues() {
      // Generate an object that has the original values of all fields
      var obj = {};

      if (this._id) {
        obj._id = this._id;
      }

      for (var name in this.fields) {
        var field = this.fields[name];

        if (field.originalValue !== undefined) {
          FormBinder.setObjectFieldValue(obj, name, field.originalValue);
        }
      }

      return obj;
    }
  }], [{
    key: 'getObjectFieldValue',
    value: function getObjectFieldValue(obj, name) {
      name.split('.').forEach(function (namePart) {
        if (obj) {
          obj = obj[namePart];
        }
      });
      return obj;
    }
  }, {
    key: 'setObjectFieldValue',
    value: function setObjectFieldValue(obj, name, value) {
      name.split('.').forEach(function (namePart, i, nameParts) {
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