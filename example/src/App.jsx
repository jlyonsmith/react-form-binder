import React from 'react'
import logo from './logo.svg'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { RegularForm } from './RegularForm'
import { Home } from './Home'
import './App.css'

export class App extends React.Component {
  constructor(props) {
    super(props)
    this.handleSave = this.handleSave.bind(this)
    this.formData = {}
  }

  handleSave(obj) {
    this.formData = obj
  }

  render() {
    return (
      <div className="app">
        <div className="app-header">
          <img src={logo} className="app-logo" alt="logo" />
          <h2>React Semantic UI Bound Components</h2>
        </div>
        <Router>
          <div className="app-content">
            <Route exact path='/' component={Home} />
            <Route path='/form' render={props => (
              <RegularForm {...props} formData={this.formData} onSave={this.handleSave} />
            )} />
          </div>
        </Router>
      </div>
    )
  }
}
