import React from 'react'
import PropTypes from 'prop-types'
import { Button } from 'semantic-ui-react'
import { getNonPropTypeProps } from '.'

export class BoundActionsButton extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    binder: PropTypes.object.isRequired,
    submit: PropTypes.bool,
    children: PropTypes.node,
    form: PropTypes.string,
  }

  constructor(props) {
    super(props)
    this.updateValue = this.updateValue.bind(this)
    this.otherProps = getNonPropTypeProps(this, props)
    props.binder.addListener(props.name, this.updateValue)
    this.state = props.binder.getFieldState(props.name)
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
      this.setState(nextProps.binder.getFieldState(nextProps.name))
    }
  }

  componentWillUpdate(nextProps, nextState) {
    this.otherProps = getNonPropTypeProps(this, nextProps)
  }

  render() {
    if (this.state.visible) {
      return (
        <Button name={this.props.name} disabled={this.state.disabled}
          type={this.props.submit ? 'submit' : 'button'} form={this.props.form}>
          {this.props.children}
        </Button>
      )
    } else {
      return null
    }
  }
}
