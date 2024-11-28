import React from 'react';
import Header from './components/Header';
import BettingPanel from './components/BettingPanel';
import Graph from './components/Graph';
import PlayerList from './components/PlayerList';

function App() {
  return (
    <div className="app">
      <Header />
      <main className="game-container">
        <Graph />
        <BettingPanel />
        <PlayerList />
      </main>
    </div>
  );
}

export default App;
