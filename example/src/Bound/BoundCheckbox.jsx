import React from 'react'
import PropTypes from 'prop-types'
import { Form, Popup, Checkbox } from 'semantic-ui-react'
import { getNonPropTypeProps } from '.'

// This is an example of a validated component with a value that can change itself, that cannot ever be invalid.

export class BoundCheckbox extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    binder: PropTypes.object.isRequired,
    label: PropTypes.string,
    width: PropTypes.number,
  }

  constructor(props) {
    super(props)
    this.otherProps = getNonPropTypeProps(this, props)
    this.state = props.binder.getFieldState(props.name)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(e, data) {
    const { binder, name } = this.props
    const state = binder.getField(name)

    if (!state.readOnly && !state.disabled) {
      this.setState(binder.updateFieldValue(name, data.checked))
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.binder !== this.props.binder) {
      this.setState(nextProps.binder.getField(nextProps.name))
    }
  }

  componentWillUpdate(nextProps, nextState) {
    this.otherProps = getNonPropTypeProps(this, nextProps)
  }

  render() {
    return (
      <Form.Field width={this.props.width} disabled={this.state.disabled}>
        <Popup content={this.props.message} position='bottom center' hoverable trigger={
          <Checkbox checked={!!this.state.value} name={this.props.name} label={this.props.label}
            onChange={this.handleChange} />} />
      </Form.Field>
    )
  }
}
