# React Form Binder

A data binding controller for React forms components. Basically, an object that manages `input`, `select`, `button` and other elements within an HTML `form`.

- As part of a controlled component it will manage the `value` for an HTML form element
- Automatically maps the fields of an object to the `named` components in the form.
- Tracks the initial values of the fields
- Allows `initValue` to initialize fields not present in the original object
- Supports mapping objects containing nested objects into the form elements
- On `onSubmit` can return an object containing just the modified fields or all fields
- Can specify certain fields as `alwaysGet` to always include them when fetching just modified fields
- Tracks an `_id` value for the object independently of form elements
- Allows for `noValue` form elements such as `OK` and `Cancel` buttons that can change state in response to modifications to the form
- Allows for a field to always be
- Manages `valid`, `disabled`, `visible`, `modified`, and `readOnly` states for the component
- Will ensure that other components in the form update in accordance with changes to a specific element
- Tracks `anyModified` and `allValid` values for the entire form
- Fires an event if the `anyModified` value changes

## Step-by-Step

To bind a `Form`:

1. Add the `bindings` object as a static property of the class, ensuring an `isValid` at minimum. `isValid` can be any truthy value or a function returning a truthy value.  Mark a field as `noValue` fields if it does not map to a field in the data object.
2. Construct the `FormBinder` object in the form component `constructor()` add assign it to a  `this.binder` variable
3. Make all form fields use a _bound component_. See below for how to make these. Note, remove existing `onChange` handlers and add a `name` and `binder` property.
4. In the forms `onSubmit` event handler method add `e.preventDefault()` (to avoid automatic form processing by HTML) and a call to  `this.binder.getModifiedFieldValues()`.

## The `FormBinder` class

Bound forms work using a `bindings` object that ideally should be declared as a `static` property of the `Form` component needing validation, like so:

```
class MyFormComponent extends React.Component {
  ...
  static bindings = {
  	email: {
  	  isValid: (r, v) => (v !== ''),
  	  isDisabled: (r) => (!!r.id)
  	},
  	changeEmail: {
  	  nonValue: true,
  	  isDisabled: (r) => (!!r.id === false)
  	},
  	...
  }
  ...
}
```

Each property of the object must correspond to the `name` property of a bound component _and_ the name of the field in the bound data object.

The following are the various things you can set for a bound field:

#### `noValue`

If `true`, indicates the field does not track a `value`. Only the _disabled_, _read-only_ and _visible_ state of the component changes in response to the value of other validated fields.  Default is `false`.

#### `isDisabled(binder, value)`

A truthy value or function returning a truthy value that indicates if the bound component should be disabled.  It's up to the bound component to implement what disable looks like.

#### `isReadOnly(binder, value)`

A truthy value or function returning a truthy value that indicates if the bound component should be read-only.  It's up to the bound component to implement what read-only looks like.

#### `isVisible(binder, value)`

A truthy value or function returning a truthy value that indicates if the bound component should be visible.  It's up to the bound component to implement looks like.

#### `isValid(validator, value)`

A boolean or predicate function that is called to determine if the current `state.value` is valid.  It's up to the bound component to implement looks like.

#### `defaultValue`

The default value to give the component `value` if it is `null` or `undefined` initially.

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

#### `getFieldState(name)`

Called to get the state for a named field. Can be used by bound components, in `binding` callback functions and elsewhere.  The for fields with a value, it looks like:

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

#### `updateFieldValue(name, newValue)`

Called to update the value of the field by name.  Typically used in bound components in response to user input.  Will cause the state for all other bound components in the form to update their state also, if the change affect them.

#### `getModifiedFieldValues()`

Typically called by you when the `submit` button event is fired to get an object containing just the modified fields.

## Building Bound components

`FormBinder` enables you to easily build _bound components_ that are automatically set from an initial data object, and allow you to easily get an object back that reflects changes to that object.  This gives you the most flexibility to create components that look good in your app, show errors the way you want to show them, etc..

See the [`example`](https://github.com/jlyonsmith/react-form-binder/tree/master/example) folder in GitHub for for a wide variety of other bound components, including a full featured credit card component which automatically formats and validates different types of credit card numbers.

Build and run the example project with:

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
