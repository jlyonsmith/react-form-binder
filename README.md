# React Form Binder

A data binding controller for React `form` and `form`-like components.  It works with both React and React Native applications. It's simpler than a full Redux implementation when all you need is to move data back and forth between a Javascript object and React components corresponding to properties of that object while validating them  and updating the other components of the form accoringly.

This library uses the term _field_ to mean some value that needs to be moved back and forth between a Javascript object and a React component. Fields contain a `state` property which contains `value` and `valid`, `disabled`, `visible`, `modified` and `readonly` propertes.  This `state` can be used to automatically update the corresponding _bound component_.  A _bindings_ object contains functions that updates the `value` property and the other fields as `value` changes.

There are two types of _bound components_. Those that maintain a `value`, e.g. text input, checkbox, dropdown, and those that have no `value`, e.g. 'OK' and 'Cancel' buttons.  Components that do not maintain a value can still change their state based on the value of other bound components on the form.

## Step-by-Step

For React applications, to bind an HTML `form`:

1. Add the `bindings` object as a static property of the class, ensuring an `isValid` at a minimum for each data field. `isValid` can be any truthy value or a function returning a truthy value.  Mark a field as `noValue` if it does not map to a property in the data object.
2. Construct the `FormBinder` object in the form component `constructor()` and assign it to a  `this.binder` variable
3. Set the `binder` property of each _bound React component_ in the `form`. NOTE: Typically, you'll want to remove any existing `onChange` handlers if converting from a non-bound component and ensure a `name` proprty.  See below for how to create bound components.
4. In the forms `onSubmit` event handler method add `e.preventDefault()` (to avoid automatic form processing by HTML) and a call to `this.binder.getModifiedFieldValues()` to get an object with the modified field values.

## The `FormBinder` class

This class does the following:

- Automatically maps the object fields (properties) to equivalently named bound components in an HTML `form`.
- Tracks the initial values of the object fields
- Allows initialization of fields not present in the original object
- Supports mapping objects containing nested objects into the form elements
- Allows returning an object that has just the fields that have been modified from their original values
- Allows specifying certain fields as `alwaysGet` to always include them when fetching just modified fields
- Manages `value` & `valid` properties on behalf of a bound component that maintain a value.
- Manages `disabled`, `visible`, `modified`, and `readOnly` states for all bound components
- Fires update events when bound components are updated
- Tracks `anyModified` and `allValid` values for the entire form
- Generates an `onAnyModified` callback if `anyModified` changes state
- Tracks an `_id` value for the object independently of form elements

Bound forms work using a `bindings` object that should be declared as a `static` property of the `form` component, like so:

```
class MyFormComponent extends React.Component {
  ...
  static bindings = {
  	email: {
  	  isValid: (b, v) => (regExpPattern.email.test(v)),
  	  isDisabled: (b) => (!!b._id)
  	},
  	changeEmail: {
  	  nonValue: true,
  	  isDisabled: (b) => (!!b._id === false)
  	},
  	...
  }

  render() {
    return (
      <form ...>...</form>
    )
  }
}
```

Each property of the `bindings` object must correspond to the `name` property of a bound component _and_ the name of the field in the bound data object.

The following are the various properties you can set for a bound field:

#### `noValue`

If `true`, indicates the field does not track a `value`. Only the `state.disabled`, `state.readOnly` and `state.visible` properties of the field change in response to the value of other validated fields.  Default is `false`.

#### `isDisabled(binder, value)`

A truthy value, or function returning a truthy value, that indicates determines `state.disabled` for the field.  It's up to the bound component to implement what disable looks like, e.g. graying out the component.

#### `isReadOnly(binder, value)`

A truthy value, or function returning a truthy value, that determines `state.readOnly` for the field.  It's up to the bound component to implement what read-only looks & behaves like, e.g. prevent mouse clicks on the component.

#### `isVisible(binder, value)`

A truthy value, or function returning a truthy value, that determines `state.visible` for the field.  It's up to the bound component to implement looks like, but it should generally correspond to being hidden or not.

#### `isValid(validator, value)`

A truthy value, or function returning a truthy value, that determines `state.valid` for the field.  It's up to the bound component to implement looks like, but generally you want to display some kind of error message when this is `true`.

#### `initValue`

The value to initialize the `state.value` if it is `null` or `undefined` initially.

### `FormBinder(obj, bindings, onAnyModifiedChanged)`

An instance of the `FormBinder` class is responsible for handling binding and holds the state for the various bound components.  To construct the class use the following in the form component constructor:

```
	this.state = {
	  binder: new FormBinder(
	  	this.props.myObject,
	  	MyForm.validations,
	  	this.props.onAnyModifiedChanged)
	}
```

The constructor takes the original object that is being modified by the form, the validation and other rules, and a callback for when the overall form modification state changes.

Next, you must pass the binder into each bound component as a property `binder={this.state.binder}`.

Assigning the binder itself to the form state allows you to change the `this.state.binder` if the object that the form displays changes, like so:

```
  componentWillReceiveProps(nextProps) {
    if (nextProps.obj !== this.props.obj) {
      this.setState({
        binder: new FormBinder(nextProps.obj, MyForm.bindings, nextProps. nextProps.onAnyModifiedChanged)
      })
    }
  }
```

This would be useful if you allow a forms contents to be changed by some other onscreen element, such as a list box.

#### `binder.getFieldState(name)`

Called to get the state for a named field. Can be used by bound components, in `binding` callback functions and elsewhere.  For fields with a value, it looks like:

```
{
  value: ...,
  valid: ...,
  disable: ...,
  visible: ...,
  readOnly: ...,
  modified: ...
}
```

For `noValue` fields the `value` and `modified` fields will not be present.

#### `binder.getFieldValue(name)`

Called to get just the `state.value` for a field.  For `noValue` fields it will of course be `undefined`.


#### `binder.updateFieldValue(name, newValue)`

Called to update the value of the field by name.  Typically used in bound components in response to user input.  Will cause the state for all other bound components in the form to update their state also, if the change affect them.

#### `binder.getModifiedFieldValues()`

Typically called by you when the `submit` button event is fired to get an object containing just the modified fields.

#### `binder._id`

This will be the value of any `_id` field on the original object. Typically, this value will be set for  existing objects that were retrieved from an API, and not set if the object is being created for the first time.  For this reason, it can be used in `binding` functions to determine if the object is being created for the first time or modified.

## Building Bound components

`FormBinder` enables you to easily build _bound components_ that are automatically set from an initial data object, and allow you to easily get an object back that reflects changes to that object.  This gives you the most flexibility to create components that look good in your app, show errors the way you want to show them, etc..

See the [`example`](https://github.com/jlyonsmith/react-form-binder/tree/master/example) folder in GitHub for for a wide variety of other bound components, including:

- A full featured credit card component which automatically formats and validates different types of credit card numbers
- A masked input component which formats input according to a mask
- A state dropdown component
- A check box component
- Valueless button components
- A container component that can shows or hides a group of components based on other bound components.

You can build and run the example project with:

```
git clone https://github.com/jlyonsmith/react-form-binder.git
cd react-form-binder
npm install
npm run build
cd example
npm install
npm start
```

On MacOS with iTerm2 installed you can run everything super easily with:

```
npm install -g snap-tool
git clone https://github.com/jlyonsmith/react-form-binder.git
cd react-form-binder
snap install
snap start
```

Lets break down the `BoundInput` component from the example, which happens to use SemanticUI.  Of course you can use _any_ React UI framework you like.  This is the most common bound component and is basically an `input` component with `type='text'`.

First, we declare our React component, ensuring we get at least a `name`, `binder`, `message` and `label`:

```
export class BoundInput extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    binder: PropTypes.object.isRequired,
    message: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    ...
  }
  ...
}
```

In the constructor we `bind()` some methods to `this` and set the initial `state`.

We also add an event listener for the `props.name` event.  The `FormBinder` will fire an event with the name of the field if some element of this fields `state`, other than `value`, changes because of another field value getting updated. The only way `value` should change is if this component updates it, or if the `binder` that this component is attached to changes.

We remove the listener in the unmount callback.

```
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.updateValue = this.updateValue.bind(this)
    props.binder.addListener(props.name, this.updateValue)
    this.state = props.binder.getFieldState(props.name)
  }

  updateValue(e) {
    this.setState(e.state)
  }

  componentWillUnmount() {
    this.props.binder.removeListener(this.props.name, this.updateValue)
  }
```

We implement the `handleChange` event which gets called every time the user types in the `input` element.

```
  handleChange(e, data) {
    const { binder, name } = this.props
    const state = binder.getFieldState(name)

    if (!state.readOnly && !state.disabled) {
      this.setState(binder.updateFieldValue(name, data.value))
    }
  }
```

Now we handle the `binder` property changing in the parent form:

```
  componentWillReceiveProps(nextProps) {
    if (nextProps.binder !== this.props.binder) {
      this.setState(nextProps.binder.getFieldState(nextProps.name))
    }
  }
```

Finally, the `render()` method to generate the DOM elements based on the `state` fields.

```
  render() {
    return (
      <Form.Field error={!this.state.valid} width={this.props.width} disabled={this.state.disabled} className={this.props.className}>
        <label>{this.props.label}</label>
        <Popup content={this.props.message} position={this.props.position || 'bottom center'}
          hoverable={true}
          trigger={
            <Input {...this.otherProps} value={this.state.value} type='text'
              name={this.props.name} onChange={this.handleChange} />
          }
        />
      </Form.Field>
    )
  }
```
