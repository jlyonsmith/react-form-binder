import EventEmitter from "eventemitter3"

export class FormBinder extends EventEmitter {
  constructor(originalObj, bindingDefs, onAnyModified) {
    super()
    this._id = originalObj._id
    this._onAnyModified = onAnyModified
    this._bindings = {}
    this._originalObj = originalObj

    for (let path in bindingDefs) {
      let bindingDef = bindingDefs[path]
      let binding = {
        isDisabled: this._ensureFunc(bindingDef.isDisabled, false),
        isReadOnly: this._ensureFunc(bindingDef.isReadOnly, false),
        isVisible: this._ensureFunc(bindingDef.isVisible, true),
        noValue: !!bindingDef.noValue,
      }

      if (binding.noValue) {
        binding.state = {}
      } else {
        binding.alwaysGet = bindingDef.alwaysGet
        binding.isValid = this._ensureFunc(bindingDef.isValid, true, true)

        let value = FormBinder._getObjectPathValue(originalObj, path)

        if (typeof value === "undefined") {
          value =
            typeof bindingDef.initValue !== "undefined"
              ? bindingDef.initValue
              : ""
        }

        value = bindingDef.pre ? bindingDef.pre(value) : value

        binding.unmodifiedValue = value
        binding.post = binding.post || ((v) => v)
        binding.state = {
          value,
          modified: false,
        }
      }

      this._bindings[path] = binding
    }

    this._updateBindingStates()
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

  updateBindingValue(path, newValue) {
    let lastAnyModified = this.anyModified
    let binding = this._bindings[path]

    if (binding) {
      if (binding.noValue) {
        throw new Error(
          `Attempt to update value for non-value binding '${path}'`
        )
      }

      binding.state.value = newValue
      binding.state.modified = newValue !== binding.unmodifiedValue

      this._updateBindingStates(binding)

      if (lastAnyModified !== this.anyModified && this._onAnyModified) {
        this._onAnyModified(this.anyModified)
      }
    }

    return binding.state
  }

  _updateBindingStates() {
    this.anyModified = false
    this.allValid = true

    for (let path in this._bindings) {
      let binding = this._bindings[path]

      // Do non-value bindings after value bindings and ignore any just changed binding
      if (binding.noValue) {
        continue
      }

      let valid = binding.isValid(this, binding.state.value, binding.metadata)

      // Only value bindings can change these two properties
      this.allValid = valid && this.allValid
      this.anyModified = binding.state.modified || this.anyModified

      Object.assign(binding.state, {
        valid,
        disabled: binding.isDisabled(this),
        readOnly: binding.isReadOnly(this),
        visible: binding.isVisible(this),
      })
    }

    for (let path in this._bindings) {
      let binding = this._bindings[path]

      if (!binding.noValue) {
        continue
      }

      let disabled = binding.isDisabled(this)
      let readOnly = binding.isReadOnly(this)
      let visible = binding.isVisible(this)

      // Did the valid, disabled, read-only or visible state of this binding change?
      let anyChanges =
        disabled !== binding.state.disabled ||
        readOnly !== binding.state.readOnly ||
        visible !== binding.state.visible

      if (anyChanges) {
        binding.state = {
          disabled,
          readOnly,
          visible,
        }

        // Fire an event so the component can update itself
        this.emit(path, { path, state: binding.state })
      }
    }
  }

  getBindingValue(path) {
    return this.getBindingState(path).value
  }

  getBindingState(path) {
    let binding = this._bindings[path]

    if (!binding) {
      throw new Error(`There is no binding entry for '${path}'`)
    }

    return binding.state
  }

  getModifiedBindingValues() {
    // Generate an object that has the modified and alwaysGet bindings
    let obj = {}

    if (!this.anyModified && !this.allValid) {
      return obj
    }

    // Will have an _id if updating
    if (this._id) {
      obj._id = this._id
    }

    for (let path in this._bindings) {
      let binding = this._bindings[path]

      if (binding.alwaysGet || (!binding.noValue && binding.state.modified)) {
        let value = binding.state.value

        if (value && value.constructor === "String") {
          value = value.trim()

          if (value === binding.unmodifiedValue) {
            continue
          }
        }

        value = binding.post ? binding.post(value) : value

        FormBinder._setObjectPathValue(obj, path, value)
      }
    }

    return obj
  }

  static _getObjectPathValue(obj, path) {
    path.split(".").forEach((namePart) => {
      if (obj) {
        obj = obj[namePart]
      }
    })
    return obj
  }

  static _setObjectPathValue(obj, path, value) {
    path.split(".").forEach((namePart, i, nameParts) => {
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
