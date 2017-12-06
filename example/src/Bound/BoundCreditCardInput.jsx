import React from 'react'
import PropTypes from 'prop-types'
import { getNonPropTypeProps, BoundMaskedInput } from '.'
import { reactAutoBind } from 'auto-bind2'

// This is an example of a validated component with a value that changes itself and keeps the value
// aligned with a format mask

export class BoundCreditCardInput extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    binder: PropTypes.object.isRequired,
    label: PropTypes.string,
    width: PropTypes.number,
  }

  constructor(props) {
    super(props)
    reactAutoBind(this)
    this.otherProps = getNonPropTypeProps(this, props)
    const state = props.binder.getFieldState(props.name)
    this.state = {
      ...state,
      cardType: BoundCreditCardInput.detectCardType(BoundMaskedInput.removeFormatting(state.value))
    }
  }

  static luhnCheck(cardNumber) {
    let length = cardNumber.length
    let multiple = 0
    const producedValue = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [0, 2, 4, 6, 8, 1, 3, 5, 7, 9]
    ]
    let sum = 0

    while (length--) {
      sum += producedValue[multiple][parseInt(cardNumber.charAt(length), 10)];
      multiple ^= 1;
    }

    return (sum % 10 === 0 && sum > 0)
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
      <BoundMaskedInput {...this.otherProps} name={this.props.name} message={this.props.message}
        binder={this.props.binder} mask={this.creditCardNumberMask}
        label={this.props.label} width={this.props.width} icon={this.state.cardType || 'credit card'} />
    )
  }

  // From https://stackoverflow.com/questions/72768/how-do-you-detect-credit-card-type-based-on-number
  static detectCardType(value) {
    let cardType = null

    const re = {
      jcb: /^(?:2131|1800|35)[0-9]{0,}$/,  //2131, 1800, 35 (3528-3589)
      amex: /^3[47][0-9]{0,}$/, //34, 37
      diners: /^3(?:0[0-59]{1}|[689])[0-9]{0,}$/, //300-305, 309, 36, 38-39
      visa: /^4[0-9]{0,}$/, //4
      mastercard: /^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)[0-9]{0,}$/, //2221-2720, 51-55
      maestro: /^(5[06789]|6)[0-9]{0,}$/, // Always growing in the range: 60-69, started with / not something else, but starting 5 must be encoded as mastercard anyway
      discover: /^(6011|65|64[4-9]|62212[6-9]|6221[3-9]|622[2-8]|6229[01]|62292[0-5])[0-9]{0,}$/
    }

    for(var key in re) {
        if(re[key].test(value)) {
            cardType = key
            break
        }
    }

    if (cardType === 'maestro') {
      if (value[0] === '5') { // starting with a 5 is a Mastercard
        cardType = 'mastercard'
      }
    }

    return cardType
  }

  creditCardNumberMask(value) {
    const unformattedValue = BoundMaskedInput.removeFormatting(value)
    const cardType = BoundCreditCardInput.detectCardType(unformattedValue)
    let mask

    switch (cardType) {
      case 'amex':
        mask = '9999 999999 99999'
        break
      case 'diners':
        mask = '9999 999999 9999'
        break
      default:
        mask = '9999 9999 9999 9999'
        break
    }

    if (cardType !== this.state.cardType) {
      this.setState({ cardType })
      return { mask, value: BoundMaskedInput.applyFormatting(unformattedValue, mask) }
    } else {
      return { mask }
    }
  }
}
