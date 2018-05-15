import React from 'react'
import PropTypes from 'prop-types'
import { reactAutoBind } from 'auto-bind2'
import { FormBinder } from 'react-form-binder'
import { Modal, Button, Icon, Header, Grid, Form } from 'semantic-ui-react'
import { BoundInput, BoundActionsButton } from './Bound'

export class DialogForm extends React.Component {
  static propTypes = {
    open: PropTypes.bool,
    onDismiss: PropTypes.func
  }

  static bindings = {
    oldPassword: {
      alwaysGet: true,
      isValid: (r, v) => (v !== '')
    },
    newPassword: {
      alwaysGet: true,
      isValid: (r, v) => (v !== '' && v !== r.getBindingValue('oldPassword'))
    },
    reenteredNewPassword: {
      alwaysGet: true,
      isValid: (r, v) => (v !== '' && v === r.getBindingValue('newPassword'))
    },
    submit: {
      isDisabled: (r) => (!r.allValid),
      noValue: true
    }
  }

  constructor(props) {
    super(props)
    reactAutoBind(this, (name) => (name.startsWith('handle')))
    this.state = {
      binder: new FormBinder({}, DialogForm.bindings)
    }
  }

  closeDialog(passwords) {
    this.setState({binder: new FormBinder({}, DialogForm.bindings)})
    this.props.onDismiss(passwords)
  }

  handleClose() {
    this.closeDialog(null)
  }

  handleSubmit(e) {
    e.preventDefault()
    let passwords = null
    const { binder } = this.state

    if (this.state.binder.allValid) {
      const oldPassword = binder.getBindingValue('oldPassword')
      const newPassword = binder.getBindingValue('newPassword')
      passwords = {
        oldPassword: oldPassword,
        newPassword: newPassword
      }
    }

    console.log(passwords)

    this.closeDialog(passwords)
  }

  handleClick(e) {
    this.closeDialog(null)
  }

  render() {
    return (
      <Modal dimmer='inverted' open={this.props.open} onClose={this.handleClose} closeOnDimmerClick={false}>
        <Header color='black' icon='edit' content='Change Password' />
        <Modal.Content>
          <Form className='user-form' id='passwordForm' onSubmit={this.handleSubmit}>
            <Grid stackable>
              <Grid.Column width={16}>
                <Form.Group>
                  <BoundInput label='Current Password' password name='oldPassword'
                    message='Your existing password, cannot be blank'
                    width={8} binder={this.state.binder} />
                </Form.Group>
                <Form.Group>
                  <BoundInput label='New Password' password name='newPassword'
                    message='A new password, cannot be blank or the same as your old password'
                    width={8} binder={this.state.binder} />
                  <BoundInput label='Re-entered New Password' password name='reenteredNewPassword'
                    message='The new password again, must match and cannot be blank'
                    width={8} binder={this.state.binder} />
                </Form.Group>
              </Grid.Column>
            </Grid>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <BoundActionsButton primary submit form='passwordForm' name='submit' binder={this.state.binder}>
            <Icon name='checkmark' /> OK
          </BoundActionsButton>
          <Button color='red' onClick={this.handleClick}>
            <Icon name='close' /> Cancel
          </Button>
        </Modal.Actions>
      </Modal>
    )
  }
}
