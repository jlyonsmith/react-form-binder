import EventEmitter from 'eventemitter3'

export class FormBinder extends EventEmitter {
  constructor(originalObj, bindings, onAnyModified) {
    super()
    this._id = originalObj._id
    this.onAnyModified = onAnyModified
    this.fields = {}

    for (let name in bindings) {
      let binding = bindings[name]
      let field = {
        isDisabled: this.ensureFunc(binding.isDisabled, false),
        isReadOnly: this.ensureFunc(binding.isReadOnly, false),
        isVisible: this.ensureFunc(binding.isVisible, true),
        noValue: !!binding.noValue
      }

      if (field.noValue) {
        field.state = {}
      } else {
        field.alwaysGet = binding.alwaysGet
        field.isValid = this.ensureFunc(binding.isValid, true, true)
        field.initValue = (binding.initValue === undefined ? '' : binding.initValue)
        field.originalValue = FormBinder.getObjectFieldValue(originalObj, name)
        field.state = {
          value: field.originalValue || field.initValue,
          modified: false
        }
      }

      this.fields[name] = field
    }

    this._updateFieldStates()
  }

  ensureFunc(obj, def, validator) {
    // If obj is a func and does not return bool there are problems, so we wrap it.
    if (obj) {
      if (obj.constructor === Function) {
        if (validator) {
          return (r, v, m) => (!!obj(r, v, m))
        } else {
          return (r) => (!!obj(r))
        }
      } else {
        return () => (!!obj)
      }
    } else {
      return () => (def)
    }
  }

  updateFieldMetadata(name, metadata) {
    let field = this.fields[name]

    if (field) {
      field.metadata = metadata
    }
  }

  updateFieldValue(name, newValue) {
    let lastAnyModified = this.anyModified
    let field = this.fields[name]

    if (field) {
      if (field.noValue) {
        throw new Error(`Attempt to update value for non-value field '${name}'`)
      }

      field.state.value = newValue
      field.state.modified = (field.originalValue !== undefined ?
        (field.originalValue !== newValue) : (newValue !== field.initValue))

      this._updateFieldStates(field)

      if (lastAnyModified !== this.anyModified && this.onAnyModified) {
        this.onAnyModified(this.anyModified)
      }
    }

    return field.state
  }

  _updateFieldStates() {
    this.anyModified = false
    this.allValid = true

    for (let name in this.fields) {
      let field = this.fields[name]

      // Do non-value fields after value fields and ignore any just changed field
      if (field.noValue) {
        continue
      }

      let valid = field.isValid(this, field.state.value, field.metadata)

      // Only value fields can change these two properties
      this.allValid = (valid && this.allValid)
      this.anyModified = (field.state.modified || this.anyModified)

      Object.assign(field.state, {
        valid,
        disabled: field.isDisabled(this),
        readOnly: field.isReadOnly(this),
        visible: field.isVisible(this)
      })
    }

    for (let name in this.fields) {
      let field = this.fields[name]

      if (!field.noValue) {
        continue
      }

      let disabled = field.isDisabled(this)
      let readOnly = field.isReadOnly(this)
      let visible = field.isVisible(this)

      // Did the valid, disabled, read-only or visible state of this field change?
      let anyChanges = (
        disabled !== field.state.disabled ||
        readOnly !== field.state.readOnly ||
        visible !== field.state.visible
      )

      if (anyChanges) {
        field.state = {
          disabled,
          readOnly,
          visible
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
    let field = this.fields[name]

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

    for (let name in this.fields) {
      let field = this.fields[name]

      if (field.alwaysGet || (!field.noValue && field.state.modified)) {
        let value = field.state.value

        if (value && value.constructor === 'String') {
          value = value.trim()
        }
        FormBinder.setObjectFieldValue(obj, name, value)
      }
    }

    return obj
  }

  getOriginalFieldValues() {
    // Generate an object that has the original values of all fields
    let obj = {}

    if (this._id) {
      obj._id = this._id
    }

    for (let name in this.fields) {
      let field = this.fields[name]

      if (field.originalValue !== undefined) {
        FormBinder.setObjectFieldValue(obj, name, field.originalValue)
      }
    }

    return obj
  }

  static getObjectFieldValue(obj, name) {
    name.split('.').forEach((namePart) => {
      if (obj) {
        obj = obj[namePart]
      }
    })
    return obj
  }

  static setObjectFieldValue(obj, name, value) {
    name.split('.').forEach((namePart, i, nameParts) => {
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
