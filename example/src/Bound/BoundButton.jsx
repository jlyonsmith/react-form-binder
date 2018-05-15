import React from 'react'
import PropTypes from 'prop-types'
import { Form, Button } from 'semantic-ui-react'
import { getNonPropTypeProps } from '.'

export class BoundButton extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    binder: PropTypes.object.isRequired,
    submit: PropTypes.bool,
    width: PropTypes.number,
    children: PropTypes.array
  }

  constructor(props) {
    super(props)
    this.updateValue = this.updateValue.bind(this)
    this.otherProps = getNonPropTypeProps(this, props)
    props.binder.addListener(props.name, this.updateValue)
    this.state = props.binder.getBindingState(props.name)
  }

  updateValue(e) {
    this.setState(e.state)
  }

  componentWillUnmount() {
    this.props.binder.removeListener(this.props.name, this.updateValue)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.binder !== this.props.binder) {
      this.props.binder.removeListener(this.props.name, this.updateValue)
      nextProps.binder.addListener(nextProps.name, this.updateValue)
      this.setState(nextProps.binder.getBindingState(nextProps.name))
    }
  }

  componentWillUpdate(nextProps, nextState) {
    this.otherProps = getNonPropTypeProps(this, nextProps)
  }

  render() {
    if (this.state.visible) {
      return (
        <Form.Field width={this.props.width} disabled={this.state.disabled}>
          <label>{this.props.label}</label>
          <Button {...this.otherProps} type={this.props.submit ? 'submit' : 'button'} name={this.props.name}>
            {this.props.children}
          </Button>
        </Form.Field>
      )
    } else {
      return null
    }
  }
}
