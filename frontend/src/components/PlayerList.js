import React from 'react';

function PlayerList() {
  const players = [
    { name: 'User1', multiplier: '1.32x', profit: '₹3,500' },
    { name: 'User2', multiplier: '1.21x', profit: '₹4,000' },
  ];

  return (
    <aside className="player-list">
      <h2>Players</h2>
      <ul>
        {players.map((player, index) => (
          <li key={index} className="player">
            <span>{player.name}</span>
            <span>{player.multiplier}</span>
            <span>{player.profit}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default PlayerList;
