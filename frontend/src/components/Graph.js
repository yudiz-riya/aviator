import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function Graph() {
  const canvasRef = useRef();

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array.from({ length: 10 }, (_, i) => `${i}s`),
        datasets: [
          {
            label: 'Multiplier',
            data: [1.0, 1.2, 1.4, 1.8, 2.1, 2.4, 2.8, 3.2, 4.0, 5.0],
            borderColor: '#FF5733',
            backgroundColor: 'rgba(255, 87, 51, 0.2)',
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
      },
    });
  }, []);

  return <canvas ref={canvasRef} className="graph"></canvas>;
}

export default Graph;
