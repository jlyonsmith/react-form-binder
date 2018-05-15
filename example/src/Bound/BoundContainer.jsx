import React from 'react'
import PropTypes from 'prop-types'

export class BoundContainer extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    binder: PropTypes.object.isRequired,
    children: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object
    ])
  }

  constructor(props) {
    super(props)
    this.updateValue = this.updateValue.bind(this)

    let { name, binder, children, ...other } = this.props

    this.otherProps = other
    binder.addListener(name, this.updateValue)
    this.state = binder.getBindingState(name)
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

  render() {
    if (this.state.visible) {
      return (
        <div {...this.otherProps}>
          {this.props.children}
        </div>
      )
    } else {
      return null
    }
  }
}
