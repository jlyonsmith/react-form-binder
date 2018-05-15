import React from 'react'
import PropTypes from 'prop-types'
import { Form, Popup, Input } from 'semantic-ui-react'
import { getNonPropTypeProps } from '.'

// This is an example of a validated component with a value that changes itself

export class BoundInput extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    binder: PropTypes.object.isRequired,
    label: PropTypes.string.isRequired,
    width: PropTypes.number,
    password: PropTypes.bool,
    position: PropTypes.string
  }

  constructor(props) {
    super(props)
    this.otherProps = getNonPropTypeProps(this, props)
    this.handleChange = this.handleChange.bind(this)
    this.updateValue = this.updateValue.bind(this)
    props.binder.addListener(props.name, this.updateValue)
    this.state = props.binder.getBindingState(props.name)
  }

  updateValue(e) {
    this.setState(e.state)
  }

  componentWillUnmount() {
    this.props.binder.removeListener(this.props.name, this.updateValue)
  }

  handleChange(e, data) {
    const { binder, name } = this.props
    const state = binder.getBindingState(name)

    if (!state.readOnly && !state.disabled) {
      this.setState(binder.updateBindingValue(name, data.value))
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.binder !== this.props.binder) {
      this.setState(nextProps.binder.getBindingState(nextProps.name))
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.props !== nextProps) {
      this.otherProps = getNonPropTypeProps(this, nextProps)
    }
  }

  render() {
    return (
      <Form.Field error={!this.state.valid} width={this.props.width} disabled={this.state.disabled} className={this.props.className}>
        <label>{this.props.label}</label>
        <Popup content={this.props.message} position={this.props.position || 'bottom center'} hoverable trigger={
          <Input {...this.otherProps} value={this.state.value} type={this.props.password ? 'password' : 'text'}
            name={this.props.name} onChange={this.handleChange} />} />
      </Form.Field>
    )
  }
}
