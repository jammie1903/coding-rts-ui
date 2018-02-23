import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Renderer from "./renderer/Renderer";
import deepstream from 'deepstream.io-client-js';

class App extends Component {

  constructor() {
    super();
    this.stream = deepstream("localhost:3091");
    this.stream.login({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ0ZXN0MSIsImlhdCI6MTUxODEwMzAxOH0.uIbYP1DbVSoFA1EF7JXp84ZNMoZsHMvS8C85tqW8aKE' });
  }

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
