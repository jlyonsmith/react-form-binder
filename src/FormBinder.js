import EventEmitter from 'eventemitter3'

export class FormBinder extends EventEmitter {
  constructor(originalObj, bindings, onAnyModified) {
    super()
    this._updateFieldValue = this._updateFieldValue.bind(this)
    this._id = originalObj._id
    this.onAnyModified = onAnyModified
    this.fields = {}
    this.noValueFields = {}

    for (let name in bindings) {
      let binding = bindings[name]
      let field = {
        isDisabled: this.ensureFunc(binding.isDisabled, false),
        isReadOnly: this.ensureFunc(binding.isReadOnly, false),
        isVisible: this.ensureFunc(binding.isVisible, true),
        noValue: !!binding.noValue
      }

      if (field.noValue) {
        field.state = {
          disabled: field.isDisabled(this),
          readOnly: field.isReadOnly(this),
          visible: field.isVisible(this),
        }
      } else {
        field.alwaysGet = binding.alwaysGet
        field.isValid = this.ensureFunc(binding.isValid, true)
        field.initValue = (binding.initValue === undefined ? '' : binding.initValue)
        field.originalValue = FormBinder.getObjectFieldValue(originalObj, name)
        this._updateFieldValue(field, field.originalValue || field.initValue)
      }
      this.fields[name] = field
    }

    this._updateOtherFields()
  }

  ensureFunc(obj, def) {
    return obj ? ((obj.constructor === Function) ? obj : () => (!!obj)) : () => (def)
  }

  updateFieldValue(name, newValue, meta) {
    let lastAnyModified = this.anyModified
    let field = this.fields[name]

    if (field) {
      this._updateFieldValue(field, newValue, meta)
      this._updateOtherFields(field)
      if (lastAnyModified !== this.anyModified && this.onAnyModified) {
        this.onAnyModified(this.anyModified)
      }
    }

    return field.state
  }

  _updateFieldValue(field, newValue) {
    field.state = {
      value: newValue,
      disabled: field.isDisabled(this),
      readOnly: field.isReadOnly(this),
      visible: field.isVisible(this),
      valid: field.isValid(this, newValue),
      modified: field.originalValue !== undefined ?
        (field.originalValue !== newValue) : (newValue !== field.initValue)
    }
  }

  _updateOtherFields(changedField) {
    if (changedField) {
      this.anyModified = changedField.state.modified
      this.allValid = changedField.state.valid
    } else {
      this.anyModified = false
      this.allValid = true
    }

    for (let name in this.fields) {
      let field = this.fields[name]

      if (changedField === field) {
        continue
      }

      let valid = undefined

      if (!field.noValue) {
        valid = field.isValid(this, field.state.value)

        this.allValid = (valid && this.allValid)
        this.anyModified = (field.state.modified || this.anyModified)
      }

      let disabled = field.isDisabled(this)
      let readOnly = field.isReadOnly(this)
      let visible = field.isVisible(this)

      // Did the valid, disabled, read-only or visible state of this field change?
      let anyChanges = (
        valid !== field.state.valid ||
        disabled !== field.state.disabled ||
        readOnly !== field.state.readOnly ||
        visible !== field.state.visible
      )

      if (anyChanges) {
        field.state = {
          valid,
          disabled,
          readOnly,
          visible,
          modified: field.state.modified,
          value: field.state.value
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
    let field = this.fields[name] || this.noValueFields[name]

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
