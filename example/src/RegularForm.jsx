import React from 'react'
import PropTypes from 'prop-types'
import { reactAutoBind } from 'auto-bind2'
import { regExpPattern } from 'regexp-pattern'
import { Grid, Form } from 'semantic-ui-react'
import './RegularForm.css'
import { FormBinder } from 'react-form-binder'
import { BoundInput, BoundButton,
  BoundDropdown, BoundContainer,
  BoundMaskedInput, BoundCreditCardInput, BoundCheckbox } from './Bound'

export class RegularForm extends React.Component {
  static propTypes = {
    onSave: PropTypes.func,
    onRemove: PropTypes.func,
    onAnyModified: PropTypes.func,
  }

  static stateOptions = [
    { value: '', text: '' },
    { value: 'AL', text: 'Alabama' },
    { value: 'AK', text: 'Alaska' },
    { value: 'AS', text: 'American Samoa' },
    { value: 'AZ', text: 'Arizona' },
    { value: 'AR', text: 'Arkansas' },
    { value: 'CA', text: 'California' },
    { value: 'CO', text: 'Colorado' },
    { value: 'CT', text: 'Connecticut' },
    { value: 'DE', text: 'Delaware' },
    { value: 'DC', text: 'District of Columbia' },
    { value: 'FM', text: 'Federated States of Micronesia' },
    { value: 'FL', text: 'Florida' },
    { value: 'GA', text: 'Georgia' },
    { value: 'GU', text: 'Guam' },
    { value: 'HI', text: 'Hawaii' },
    { value: 'ID', text: 'Idaho' },
    { value: 'IL', text: 'Illinois' },
    { value: 'IN', text: 'Indiana' },
    { value: 'IA', text: 'Iowa' },
    { value: 'KS', text: 'Kansas' },
    { value: 'KY', text: 'Kentucky' },
    { value: 'LA', text: 'Louisiana' },
    { value: 'ME', text: 'Maine' },
    { value: 'MH', text: 'Marshall Islands' },
    { value: 'MD', text: 'Maryland' },
    { value: 'MA', text: 'Massachusetts' },
    { value: 'MI', text: 'Michigan' },
    { value: 'MN', text: 'Minnesota' },
    { value: 'MS', text: 'Missippi' },
    { value: 'MO', text: 'Missouri' },
    { value: 'MT', text: 'Montana' },
    { value: 'NE', text: 'Nebraska' },
    { value: 'NV', text: 'Nevada' },
    { value: 'NH', text: 'New Hampshire' },
    { value: 'NJ', text: 'New Jersey' },
    { value: 'NM', text: 'New Mexico' },
    { value: 'NY', text: 'New York' },
    { value: 'NC', text: 'North Carolina' },
    { value: 'ND', text: 'North Dakota' },
    { value: 'MP', text: 'Northern Mariana Islands' },
    { value: 'OH', text: 'Ohio' },
    { value: 'OK', text: 'Oklahoma' },
    { value: 'OR', text: 'Oregon' },
    { value: 'PW', text: 'Palau' },
    { value: 'PA', text: 'Pennsylvania' },
    { value: 'PR', text: 'Puerto Rico' },
    { value: 'RI', text: 'Rhode Island' },
    { value: 'SC', text: 'South Carolina' },
    { value: 'SD', text: 'South Dakota' },
    { value: 'TN', text: 'Tennessee' },
    { value: 'TX', text: 'Texas' },
    { value: 'UT', text: 'Utah' },
    { value: 'VT', text: 'Vermont' },
    { value: 'VI', text: 'Virgin Islands' },
    { value: 'VA', text: 'Virginia' },
    { value: 'WA', text: 'Washington' },
    { value: 'WV', text: 'West Virginia' },
    { value: 'WI', text: 'Wisconsin' },
    { value: 'WY', text: 'Wyoming' }
  ]

  static accessLevels = [
    { value: 'employee', text: 'Employee' },
    { value: 'administrator', text: 'Administrator' },
  ]

  static bindings = {
    email: {
      isValid: (r, v) => (regExpPattern.email.test(v)),
      isDisabled: (r) => (r._id)
    },
    emailBound: {
      isDisabled: (r) => (!r._id)
    },
    changeEmail: {
      noValue: true,
      isDisabled: (r) => (!r._id)
    },
    name: {
      isValid: (r, v) => (v !== '')
    },
    admin: {
      initValue: false,
      alwaysGet: true,
    },
    zip: {
      isValid: (r, v) => (v === '' || regExpPattern.zip.test(v))
    },
    state: {
      isValid: (r, v) => (v === '' || regExpPattern.state.test(v))
    },
    address: {
      isValid: true
    },
    magic: {
      isValid: true
    },
    homePhone: {
      isValid: (r, v, m) => (v === '' || (m && v.length === m.mask.length))
    },
    ssn: {
      isValid: (r, v, m) => {
        return v === '' || (m && v.length === m.mask.length)
      }
    },
    role: {
      isValid: (r, v) => (v !== ''),
      isDisabled: false
    },
    remove: {
      noValue: true,
      isVisible: (r) => (r._id),
      isDisabled: false
    },
    reset: {
      noValue: true,
      isDisabled: (r) => (!r.anyModified)
    },
    submit: {
      noValue: true,
      isDisabled: (r) => {
        return !(r.anyModified && r.allValid)
      }
    },
    'admin-fields': {
      noValue: true,
      isVisible: (r, v) => (r.getFieldValue('role') === 'administrator')
    },
    'employee-fields': {
      noValue: true,
      isVisible: (r, v) => (r.getFieldValue('role') !== 'employee')
    },
    'cardNumber': {
      // TODO: Figure a way to put "v.length === m.mask.length" back in
      isValid: (r, v) => {
        return v === '' || BoundCreditCardInput.luhnCheck(v.replace(/ /g, ''))
      },
    },
    'cardExp': {
      isValid: true,
      pre: (v) => v !== '' ? (v.substr(0, 2) + "/" + v.substr(2,2)) : '',
      post: (v) => v !== '' ? (v.substr(0, 2) + v.substr(3,2)) : ''
    },
    'cardCVC': {
      isValid: true
    }
  }

  constructor(props) {
    super(props)

    const obj = {
      name: "John Oliver",
      email: "john@oliver.org",
      cardExp: "9999"
    }

    reactAutoBind(this, (name) => (name.startsWith('handle')))
    this.state = {
      binder: new FormBinder(obj, RegularForm.bindings, this.props.onAnyModified)
    }
  }

  handleSubmit(e) {
    e.preventDefault()

    let obj = this.state.binder.getModifiedFieldValues()
    const onSave = this.props.onSave

    if (obj && onSave) {
      onSave(obj)
    }

    console.log(obj)

    this.props.history.replace('/')
  }

  handleReset() {
    const onAnyModified = this.props.onAnyModified

    this.setState({ binder: new FormBinder(this.state.binder.originalObj, RegularForm.bindings, onAnyModified) })
    if (onAnyModified) {
      onAnyModified(false)
    }
  }

  render() {
    return (
      <Form className='regular-form' onSubmit={this.handleSubmit}>
        <Grid stackable>
          <Grid.Column width={16}>
            <Form.Group>
              <BoundDropdown fluid selection label={'Access Level'} width={6}
                options={RegularForm.accessLevels} name='role' message='The user role and security level'
                placeholder='(Unspecified)' binder={this.state.binder} />
            </Form.Group>
            <Form.Group>
              <BoundInput label='Name' name='name' width={8} message='First and last names'
                binder={this.state.binder} icon='address card outline' data-lpignore={true} />
            </Form.Group>
            <Form.Group>
              <BoundInput label='Email' name='email' width={8} message='Must be a valid email address. Required.'
                binder={this.state.binder} />
            </Form.Group>
            <Form.Group>
              <BoundCheckbox label='Administrator' name='admin'
                binder={this.state.binder} message='Is this user an administrator?' />
            </Form.Group>

            <Form.Group>
              <BoundInput label='Zip' width={4} name='zip' message='5 Character U.S. Zip Code. Optional.'
                position='top center' binder={this.state.binder} />
            </Form.Group>

            <Form.Group>
              <BoundDropdown fluid selection search label='State' name='state' width={4}
                message='Select a U.S. state' placeholder='Select State'
                options={RegularForm.stateOptions} binder={this.state.binder} />
            </Form.Group>

            <Form.Group>
              <BoundInput label='Address' width={12} name='address'
                binder={this.state.binder} message='Primary Street Address. Optional.' />
            </Form.Group>

            <Form.Group>
              <BoundMaskedInput label='Home Phone' width={8} name='homePhone' mask='(999) 999 9999'
                binder={this.state.binder} message='A valid U.S. phone number. Optional.' />
            </Form.Group>

            <Form.Group>
              <BoundCreditCardInput label='Credit Card' width={8} name='cardNumber'
                binder={this.state.binder} message='A credit credit card number' />
              <BoundMaskedInput label='Expiration' width={3} name='cardExp' mask='99/99'
                binder={this.state.binder} message='A credit card expiration.' />
              <BoundMaskedInput label='CVC' width={3} name='cardCVC' mask='9999'
                binder={this.state.binder} message='A credit card CVC/CVV number.' />
            </Form.Group>

            <Form.Group>
              <BoundMaskedInput label='SSN' width={6} name='ssn' mask='999-99-9999'
                binder={this.state.binder} message='U.S. Social Security Number, e.g. 123-45-6789' />
            </Form.Group>

            <BoundContainer className='admin-field-group' name='admin-fields' binder={this.state.binder}>
              <Form.Group>
                <BoundInput label='Magic Admin Field' width={8} name='magic'
                  message='A magical spell.' binder={this.state.binder} />
              </Form.Group>
            </BoundContainer>

            <Form.Group>
              <BoundButton fluid color='red' width={4} size='medium' content='Remove' label='&nbsp;' name='remove'
                binder={this.state.binder} onClick={this.props.onRemove} />
              <BoundButton fluid width={4} size='medium' content='Reset' label='&nbsp;' name='reset'
                binder={this.state.binder} onClick={this.handleReset} />
              <Form.Field width={this.state.binder._id ? 8 : 12} />
              <BoundButton fluid primary submit width={4} size='medium'
                content={this.state.binder._id ? 'Save' : 'Add'} label='&nbsp;' name='submit'
                binder={this.state.binder} />
            </Form.Group>
          </Grid.Column>
        </Grid>
      </Form>
    )
  }
}
