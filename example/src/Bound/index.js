export { BoundInput } from './BoundInput'
export { BoundMaskedInput } from './BoundMaskedInput'
export { BoundCreditCardInput } from './BoundCreditCardInput'
export { BoundButton } from './BoundButton'
export { BoundActionsButton } from './BoundActionsButton'
export { BoundDropdown } from './BoundDropdown'
export { BoundCheckbox } from './BoundCheckbox'
export { BoundContainer } from './BoundContainer'

export function getNonPropTypeProps(obj, props) {
  const propTypes = obj.constructor.propTypes

  return Object.keys(props)
    .filter(key => (!propTypes.hasOwnProperty(key)))
    .reduce((obj, key) => { obj[key] = props[key]; return obj }, {})
}
