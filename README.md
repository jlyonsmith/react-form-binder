# React Form Binder


A form data binder that works with both [React](https://reactjs.org/) and [React Native](https://facebook.github.io/react-native/). This library is essentially a controlled component manager for data entry forms.

When building data entry forms with React there are things that are common to all forms:

- Moving data to and from a transmission object, such as the payload of an API call
- Tracking whether the data has been modified and filter out only the modified data
- Validating the the form components contain valid data
- Setting the enabled, read-only or visible state of components based on the value of other components.
- Transforming data from & to the transmission format, e.g. date/times from ISO 8601 to local time.

This library uses the term `field` to mean some value that needs to be moved back and forth between a Javascript object and a React component. Fields maintain a `state` property which contains `value` and `valid`, `disabled`, `visible`, `modified` and `readonly` propertes.  This `state` can be used to automatically update the corresponding React _bound component_.  A `bindings` object contains functions that updates the `value` property and the other fields as `value` changes.

There are two types of bound components. Those that maintain a `value`, e.g. text input, checkbox, dropdown, and those that have no `value`, e.g. 'OK' and 'Cancel' buttons.  Components that do not maintain a value can still change their state based on the value of other bound components on the form.

## Step-by-Step

Here are the step-by-step instructions to use the library for a React application:

1. Add the `bindings` object as a static property of the class, ensuring an `isValid` at a minimum for each data field. `isValid` can be any truthy value or a function returning a truthy value.  Mark a field as `noValue` if it does not map to a property in the data object.
2. Construct the `FormBinder` object in the form component `constructor()` and assign it to either `this.binder` (or `this.state.binder` if the bindings will be changing)
3. Set the `binder` property of each _bound React component_ in the `form`. NOTE: Typically, you'll want to remove any existing `onChange` handlers if converting from a non-bound component and ensure a `name` proprty.  See below for how to create bound components.
4. For HTML, in the `onSubmit` event handler method add `e.preventDefault()` (to avoid automatic form processing by HTML)
5. Call `this.binder.getModifiedFieldValues()` to get an object with the modified field values at any time.

## Class: `Bindings`

Bound forms work using a `bindings` object that should be declared as a `static` property of the `form` component.  Here is an example:

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

You can use `.`'s in the name of the binding property. If you do this you must of course quote the binding name in Javascript.  In this way you create a binding between a nested data object in the transmission object.

The following are the various properties you can set for a bound field.

### Property: `noValue: bool`

If `true`, indicates the field does not track a `value`. Only the `state.disabled`, `state.readOnly` and `state.visible` properties of the field change in response to the value of other validated fields.  Default is `false`.

### Property: `initValue: any`

Initial value to give the field if it is not present in the internal object.

### Property: `isDisabled: bool | (binder: FormBinder, value: any) => bool`

A truthy value, or function returning a truthy value, that indicates determines `state.disabled` for the field.  It's up to the bound component to implement what disable looks like, e.g. graying out the component.

### Property: `isReadOnly: bool | (binder: FormBinder, value: any) => bool`

A truthy value, or function returning a truthy value, that determines `state.readOnly` for the field.  It's up to the bound component to implement what read-only looks & behaves like, e.g. prevent mouse clicks on the component.

### Property: `initValue: any` (default: `""`)

The value to give the field if its property is `undefined` in the internal object.

### Function: `isVisible: bool | (binder: FormBinder, value: any) => bool`

A truthy value, or function returning a truthy value, that determines `state.visible` for the field.  It's up to the bound component to implement looks like, but it should generally correspond to being hidden or not.

### Function: `isValid: bool | (binder: FormBinder, value: any) => bool`

A truthy value, or function returning a truthy value, that determines `state.valid` for the field. It's up to the bound component to implement looks like, but generally you want to display some kind of error message when this is `false`.

### Function: `pre (binder: FormBinder, value: any) => any`

A function used to pre-process the field value for use by the bound component.

### Function: `post: (binder: FormBinder, value: any) => any`

A function use to post-process the field value to a format used for internal data transmission or storage.

## Class: `FormBinder(obj: object, bindings: Bindings, onAnyModified: () => ())`

An instance of the `FormBinder` class is responsible for handling binding and holds the state for the various bound components. This class does the following:

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

Here's an example of how to construct the class:

```
	this.state = {
	  binder: new FormBinder(
	  	this.props.myObject,
	  	MyForm.validations,
	  	this.props.onAnyModifiedChanged)
	}
```

### Constructor: `constructor(obj: Object, bindings: Bindings, onAnyModified: bool)`

The constructor takes the original object that is being modified by the form, the `Bindings` object, and a callback for when the overall form modification state changes.

You must pass the `FormBinder` instance to each bound component as a property `binder={this.state.binder}` so save it in `this` or `this.state`.

Assigning the binder to the form state allows you to change it if the the object that the form displays changes.  You can use the `componentWillReceiveProps` method to update the `FormBinder`, like so:

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

### Property: `id: string`

This will be the value of any `_id` field on the original object. Typically, this value will be set for  existing objects that were retrieved from an API, and not set if the object is being created for the first time.  For this reason, it can be used in `binding` functions to determine if the object is being created for the first time or modified.

### Property: `originalObj: Object`

The original object passed into the constructor.

### Method: `getFieldState(name: string): ValueState | NoValueState`

Called to get the state for a named field. Can be used by bound components, in `binding` callback functions and elsewhere.

### Method: `getFieldValue(name: string): string`

Called to get just the `state.value` for a field.  For `noValue` fields it will of course be `undefined`.

### Method: `updateFieldValue(name: string, newValue: any): State`

Called to update the value of the field by name.  Typically used in bound components in response to user input.  Will cause the state for all other bound components in the form to update their state also, if the change affect them.

### Method: `getModifiedFieldValues(): Object`

Typically called by you when the `submit` button event is fired to get an object containing just the modified fields.

## Class: `NoValueState`

The object returned from `noValue` fields.

### Property: `valid: bool`

Is the data valid?

### Property: `disable: bool`

Should the bound component be disabled?

### Property: `visible: bool`

Should the bound component be visible?

### Property: `readOnly: bool`

Is the bound component read-only?

## Class: `ValueState` extends `NoValueState`

For fields with a value, `NoValueState` is extended with `value` and `modified` properties.

### Property: `value: any`

The field value

### Property: `modified: bool`

Has the bound component been modified from it's original value?

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
