import React from 'react'
import PropTypes from 'prop-types'
import { Form, Popup, Input } from 'semantic-ui-react'
import { getNonPropTypeProps } from '.'

// This is an example of a validated component with a value that changes itself and keeps the value
// aligned with a format mask

export class BoundMaskedInput extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    binder: PropTypes.object.isRequired,
    label: PropTypes.string,
    width: PropTypes.number,
    password: PropTypes.bool,
    mask: function(props, propName) {
      const prop = props[propName]

      if (!prop) {
        return new Error(`Prop '${propName}' is required`)
      } else if (typeof prop === 'string') {
        if (!prop.includes('9')) {
          return new Error(`Invalid prop '${propName}' string does not contain any digits, indicated by the number 9`)
        }
      } else if (typeof prop !== 'function') {
        return new Error(`Invalid prop '${propName}' must be a string or a function`)
      }
    }
  }

  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.otherProps = getNonPropTypeProps(this, props)
    this.state = props.binder.getFieldState(props.name)
  }

  handleChange(e) {
    e.preventDefault()
  }

  handleKeyDown(e) {
    e.preventDefault()
    const key = e.key || e.keyCode

    const { binder, name } = this.props
    let { mask } = this.props
    const state = binder.getFieldState(name)

    if (!state.readOnly && !state.disabled) {
      const field = binder.getFieldState(name)
      let value = field.value

      if (typeof mask === 'function') {
        const obj = mask(value)

        if (obj) {
          mask = obj.mask || mask
          value = obj.value || value
        }
      }

      // Only digits are supported characters
      switch (key) {
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          if (value === '') {
            // Move to first '9' in mask
            while (mask[value.length] !== '9') {
              value += mask[value.length]
            }
          } else if (value.length === mask.length) {
            return
          }

          value += key

          // Move to next '9' in mask
          while (value.length < mask.length && mask[value.length] !== '9') {
            value += mask[value.length]
          }
          break

        case 'Backspace':
          // Move back to previous 9 in mask, or empty string
          do {
            value = value.substring(0, value.length - 1)
          } while (value.length > 0 && mask[value.length] !== '9')
          break;

        default:
          return
      }

      this.setState(binder.updateFieldValue(name, value))
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.binder !== this.props.binder) {
      this.setState(nextProps.binder.getFieldState(nextProps.name))
    }
  }

  componentWillUpdate(nextProps, nextState) {
    this.otherProps = getNonPropTypeProps(this, nextProps)
  }

  render() {
    return (
      <Form.Field error={!this.state.valid} width={this.props.width} disabled={this.state.disabled}>
        <label>{this.props.label}</label>
        <Popup content={this.props.message} position='bottom center' hoverable trigger={
          <Input {...this.otherProps} value={this.state.value} type={this.props.password ? 'password' : 'text'}
            name={this.props.name} onChange={this.handleChange} onKeyDown={this.handleKeyDown} />} />
      </Form.Field>
    )
  }

  static removeFormatting(value) {
    return value.replace(/\D/g, '')
  }

  static applyFormatting(value, mask) {
    const maskLen = mask.length
    const valueLen = value.length
    let newValue = ''
    let i = 0
    let j = 0

    while (i < maskLen && j < valueLen) {
      if (mask[i] === '9') {
        newValue += value[j++]
      } else {
        newValue += mask[i++]
      }
    }

    return newValue
  }
}
