import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Renderer from "./renderer/Renderer";

class App extends Component {

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Coding RTS</h1>
        </header>

        <Renderer />

      </div>
    );
  }
}

export default App;
