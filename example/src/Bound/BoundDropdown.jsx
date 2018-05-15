import React from 'react'
import PropTypes from 'prop-types'
import { Form, Dropdown, Popup } from 'semantic-ui-react'
import { getNonPropTypeProps } from '.'

export class BoundDropdown extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    binder: PropTypes.object.isRequired,
    label: PropTypes.string,
    width: PropTypes.number,
    position: PropTypes.string
  }

  constructor(props) {
    super(props)
    this.otherProps = getNonPropTypeProps(this, props)
    this.state = props.binder.getBindingState(props.name)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(e, data) {
    const { binder, name } = this.props

    this.setState(binder.updateBindingValue(name, data.value))
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.binder !== this.props.binder) {
      this.setState(nextProps.binder.getBindingState(nextProps.name))
    }
  }

  componentWillUpdate(nextProps, nextState) {
    this.otherProps = getNonPropTypeProps(this, nextProps)
  }

  render() {
    return (
      <Form.Field error={!this.state.valid} width={this.props.width}>
        <label>{this.props.label}</label>
        <Popup content={this.props.message} position={this.props.position || 'right center'} hoverable trigger={
          <Dropdown {...this.otherProps} disabled={this.state.disabled} readOnly={this.state.readOnly}
            value={this.state.value} onChange={this.handleChange} />} />
      </Form.Field>
    )
  }
}
