import React from 'react'
import { Link } from 'react-router-dom'
import { Grid, Button, Icon } from 'semantic-ui-react'
import { DialogForm } from './DialogForm'
import { reactAutoBind } from 'auto-bind2'
import './Home.css'

export class Home extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      dialogForm: null
    }
    reactAutoBind(this, (name) => (name.startsWith('handle')))
  }

  handleDialogFormOpen() {
    this.setState({ dialogForm: {} })
  }

  handleDialogFormDismiss() {
    this.setState({ dialogForm: null })
  }

  render() {
    return (
      <div>
        <Grid container columns={3}>
          <Grid.Column />
          <Grid.Column>
            <Grid.Row textAlign='center'>
              <Button fluid color='blue' as={Link} to={`/form`}>
                <Icon name='edit' />Regular Form
              </Button>
            </Grid.Row>
            <Grid.Row textAlign='center'>
              <Button fluid color='blue' onClick={this.handleDialogFormOpen}>
                <Icon name='comment' />Dialog Form
              </Button>
            </Grid.Row>
          </Grid.Column>
          <Grid.Column />
        </Grid>

        <DialogForm open={!!this.state.dialogForm} onDismiss={this.handleDialogFormDismiss} />
      </div>
    )
  }
}
