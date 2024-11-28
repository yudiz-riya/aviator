import React, { useState } from 'react';

function BettingPanel() {
  const [betAmount, setBetAmount] = useState('');
  const [cashout, setCashout] = useState('');

  return (
    <section className="betting-panel">
      <div className="betting-controls">
        <input 
          type="number" 
          placeholder="Bet Amount" 
          value={betAmount} 
          onChange={(e) => setBetAmount(e.target.value)} 
        />
        <input 
          type="number" 
          placeholder="Cashout At" 
          value={cashout} 
          onChange={(e) => setCashout(e.target.value)} 
        />
        <button className="bet-button">Bet (Next Round)</button>
      </div>
    </section>
  );
}

export default BettingPanel;
