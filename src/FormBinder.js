import EventEmitter from "eventemitter3"

export class FormBinder extends EventEmitter {
  constructor(originalObj, bindings, onAnyModified) {
    super()
    this._id = originalObj._id
    this._onAnyModified = onAnyModified
    this._fields = {}
    this._originalObj = originalObj

    for (let name in bindings) {
      let binding = bindings[name]
      let field = {
        isDisabled: this._ensureFunc(binding.isDisabled, false),
        isReadOnly: this._ensureFunc(binding.isReadOnly, false),
        isVisible: this._ensureFunc(binding.isVisible, true),
        noValue: !!binding.noValue,
      }

      if (field.noValue) {
        field.state = {}
      } else {
        field.alwaysGet = binding.alwaysGet
        field.isValid = this._ensureFunc(binding.isValid, true, true)

        let value = FormBinder._getObjectFieldValue(originalObj, name)

        if (typeof value === "undefined") {
          value = binding.initValue || ""
        }

        field.unmodifiedValue = value

        field.post = field.post || ((v) => v)
        field.state = {
          value: binding.pre ? binding.pre(value) : value,
          modified: false,
        }
      }

      this._fields[name] = field
    }

    this._updateFieldStates()
  }

  get id() {
    return this._id
  }

  get originalObj() {
    return this._originalObj
  }

  _ensureFunc(obj, def, validator) {
    // If obj is a func and does not return bool there are problems, so we wrap it.
    if (obj) {
      if (obj.constructor === Function) {
        if (validator) {
          return (r, v, m) => !!obj(r, v, m)
        } else {
          return (r) => !!obj(r)
        }
      } else {
        return () => !!obj
      }
    } else {
      return () => def
    }
  }

  updateFieldValue(name, newValue) {
    let lastAnyModified = this.anyModified
    let field = this._fields[name]

    if (field) {
      if (field.noValue) {
        throw new Error(`Attempt to update value for non-value field '${name}'`)
      }

      field.state.value = newValue
      field.state.modified = newValue !== field.unmodifiedValue

      this._updateFieldStates(field)

      if (lastAnyModified !== this.anyModified && this._onAnyModified) {
        this._onAnyModified(this.anyModified)
      }
    }

    return field.state
  }

  _updateFieldStates() {
    this.anyModified = false
    this.allValid = true

    for (let name in this._fields) {
      let field = this._fields[name]

      // Do non-value fields after value fields and ignore any just changed field
      if (field.noValue) {
        continue
      }

      let valid = field.isValid(this, field.state.value, field.metadata)

      // Only value fields can change these two properties
      this.allValid = valid && this.allValid
      this.anyModified = field.state.modified || this.anyModified

      Object.assign(field.state, {
        valid,
        disabled: field.isDisabled(this),
        readOnly: field.isReadOnly(this),
        visible: field.isVisible(this),
      })
    }

    for (let name in this._fields) {
      let field = this._fields[name]

      if (!field.noValue) {
        continue
      }

      let disabled = field.isDisabled(this)
      let readOnly = field.isReadOnly(this)
      let visible = field.isVisible(this)

      // Did the valid, disabled, read-only or visible state of this field change?
      let anyChanges =
        disabled !== field.state.disabled ||
        readOnly !== field.state.readOnly ||
        visible !== field.state.visible

      if (anyChanges) {
        field.state = {
          disabled,
          readOnly,
          visible,
        }

        // Fire an event so the component can update itself
        this.emit(name, { name, state: field.state })
      }
    }
  }

  getFieldValue(name) {
    return this.getFieldState(name).value
  }

  getFieldState(name) {
    let field = this._fields[name]

    if (!field) {
      throw new Error(`Field '${name}' does not have a binding entry`)
    }

    return field.state
  }

  getModifiedFieldValues() {
    // Generate an object that has the modified and alwaysGet fields
    let obj = {}

    if (!this.anyModified && !this.allValid) {
      return obj
    }

    // Will have an _id if updating
    if (this._id) {
      obj._id = this._id
    }

    for (let name in this._fields) {
      let field = this._fields[name]

      if (field.alwaysGet || (!field.noValue && field.state.modified)) {
        let value = field.state.value

        if (value && value.constructor === "String") {
          value = value.trim()

          if (value === field.unmodifiedValue) {
            continue
          }
        }

        value = field.post ? field.post(value) : value

        FormBinder._setObjectFieldValue(obj, name, value)
      }
    }

    return obj
  }

  static _getObjectFieldValue(obj, name) {
    name.split(".").forEach((namePart) => {
      if (obj) {
        obj = obj[namePart]
      }
    })
    return obj
  }

  static _setObjectFieldValue(obj, name, value) {
    name.split(".").forEach((namePart, i, nameParts) => {
      if (i < nameParts.length - 1) {
        if (!obj[namePart]) {
          obj[namePart] = {}
        }
        obj = obj[namePart]
      } else {
        obj[namePart] = value
      }
    })
  }
}
