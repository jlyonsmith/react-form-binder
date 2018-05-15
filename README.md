A React data entry form binder. Automatically controls component state, validates and translates data to and from internal data objects. Works with both [React](https://reactjs.org/) and [React Native](https://facebook.github.io/react-native/).

When building data entry forms with React there are a bunch of things that you will want to do in pretty much all cases:

- Move data to and from an internal transmission or storage object, such as the payload of an API call or a database record.
- Track whether the data has been modified and filter out only the modified properties
- Validate that the React components on the form contain valid data
- Set the enabled, read-only or visible state of components on the form based on the value of other components.
- Transform data from and to the transmission/storage format, e.g. date/times from ISO 8601 to local time.
- Be able to easily detect the validity and modification state of the entire form.

## Glossary

**Binding** - an object that defines how to move data back and forth from the internal data format to the React form components used to edit that data.

**Binding Definition** - a set of properties that define the *binding*.

**Binder** - an object that manages a collection of *bindings*.

**Bound Component** - a React component that uses a _binder_ to control it's state. There are two types of bound components. Those that maintain a `value` as part of their `state`, e.g. text input, checkbox, dropdown, and those that maintain no `value`, e.g. 'OK' and 'Cancel' buttons.  Non-`value` components can an still change their state based on the value of other bound components on the form.

## Step-by-Step

Here are the step-by-step instructions to use the library for a React application:

1. Add the `bindings` definition object as a static property of the class, ensuring an `isValid` at a minimum for each binding. `isValid` can be any truthy value or a function returning a truthy value.  Mark a binding as `noValue` if it does not map to a property in the data object.

2. Construct the `FormBinder` object in the form component `constructor()` and assign it to either `this.binder` (or `this.state.binder` if the bindings will be changing)

3. Set the `binder` property of each bound React component in the `form`.  Typically, you'll want to remove any existing `onChange` handlers if converting from a non-bound component and ensure a `name` proprty.  See below for how to create bound components.

4. For HTML, in the `onSubmit` event handler method add `e.preventDefault()` (to avoid automatic form processing by HTML)

5. Call `this.binder.getModifiedBindingValues()` to get an object with the modified values at any time.

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

Each property of the `bindings` object must correspond to the `name` property of a React component in the form.

You can use `.`'s in the name of the binding property, but you must quote the name.  This create a *path* to a nested object within the internal data object.

The following are the various properties you can set for a binding definition.

### Property: `noValue: bool`

If `true`, indicates the binding does not track a `value`. Only the `state.disabled`, `state.readOnly` and `state.visible` properties of the binding change in response to the value of other bindings.  Default is `false`.

### Property: `initValue: any`

Initial `state.value` to give the binding if it is not present in the internal object.

### Property: `isDisabled: bool | (binder: FormBinder, value: any) => bool`

A truthy value, or function returning a truthy value, that indicates determines `state.disabled` for the binding.  It's up to the bound component to implement what disable looks like, e.g. graying out the component.

### Property: `isReadOnly: bool | (binder: FormBinder, value: any) => bool`

A truthy value, or function returning a truthy value, that determines `state.readOnly` for the binding.  It's up to the bound component to implement what read-only looks & behaves like, e.g. prevent mouse clicks on the component.

### Property: `initValue: any` (default: `""`)

The value to give the `state.value` if its property is `undefined` in the internal object.  This value will still be passed to the `pre` function if it exists.  The `binder` will never pass a property that is `undefined` in the original object, so use `initValue` if the bound component must have an actual value to function, even if that value is `null`.

### Function: `isVisible: bool | (binder: FormBinder, value: any) => bool`

A truthy value, or function returning a truthy value, that determines `state.visible` for the binding.  It's up to the bound component to implement looks like, but it should generally correspond to being hidden or not.

### Function: `isValid: bool | (binder: FormBinder, value: any) => bool`

A truthy value, or function returning a truthy value, that determines `state.valid` for the binding. It's up to the bound component to implement looks like, but generally you want to display some kind of error message when this is `false`.

### Function: `pre (binder: FormBinder, value: any) => any`

A function used to pre-process the binding `value` for use by the bound component.

### Function: `post: (binder: FormBinder, value: any) => any`

A function use to post-process the binding `value` to a format used for internal data transmission or storage.

## Class: `FormBinder(obj: object, bindings: Bindings, onAnyModified: () => ())`

The `FormBinder` class is responsible for holding a collection of bindings. Here's an example of how to construct the class:

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

This will be the value of any `_id` property on the original object. Typically, this value will be set for  existing objects that were retrieved from an API, and not set if the object is being created for the first time.  For this reason, it can be used in `binding` functions to determine if the object is being created for the first time or modified.

### Property: `originalObj: Object`

The original object passed into the constructor.

### Method: `getBindingState(name: string): ValueState | NoValueState`

Called to get the state for a binding. Can be used by bound components, in `binding` callback functions and elsewhere.

### Method: `getBindingValue(name: string): string`

Called to get just the `state.value` for a binding.  For `noValue` bindings it will of course be `undefined`.

### Method: `updateBindingValue(name: string, newValue: any): State`

Called to update the value of the binding by name.  Typically used in bound components in response to user input.  Will cause the state for all other bound components in the form to update their state also, if the change affect them.

### Method: `getModifiedBindingValues(): Object`

Typically called by you when the `submit` button event is fired to get an object containing just the modified bindings.

## Class: `NoValueState`

The object returned from `noValue` bindings.

### Property: `valid: bool`

Is the data valid?

### Property: `disable: bool`

Should the bound component be disabled?

### Property: `visible: bool`

Should the bound component be visible?

### Property: `readOnly: bool`

Is the bound component read-only?

## Class: `ValueState` extends `NoValueState`

For bindings with a value, `NoValueState` is extended with `value` and `modified` properties.

### Property: `value: any`

The binding value

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

We also add an event listener for the `props.name` event.  The `FormBinder` will fire an event with the name of the binding if some element of this bindings `state`, other than `value`, changes because of another binding value getting updated. The only way `value` should change is if this component updates it, or if the `binder` that this component is attached to changes.

We remove the listener in the unmount callback.

```
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.updateValue = this.updateValue.bind(this)
    props.binder.addListener(props.name, this.updateValue)
    this.state = props.binder.getBindingState(props.name)
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
    const state = binder.getBindingState(name)

    if (!state.readOnly && !state.disabled) {
      this.setState(binder.updateBindingValue(name, data.value))
    }
  }
```

Now we handle the `binder` property changing in the parent form:

```
  componentWillReceiveProps(nextProps) {
    if (nextProps.binder !== this.props.binder) {
      this.setState(nextProps.binder.getBindingState(nextProps.name))
    }
  }
```

Finally, the `render()` method to generate the DOM elements based on the binding `state`'s.

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

## Release Notes

### 3.0.0

Follows closely on the release of **2.0.x** because I decided to remove all use of the term _field_ and instead double down on the term _binding_.  This changes the API, which is breaking change and thus a major version number increment.  In my opinion it makes the entire library more consistent and much easier to learn and understand. This release also passed the initial value to `pre` and uses the resulting value as the unmodified value against which to compare the binding value.
