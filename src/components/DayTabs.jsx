// src/components/DayTabs.jsx
import React from 'react';
import '../styles/designTokens.css';
import './DayTabs.css';

export default function DayTabs({ days, activeDay, setActiveDay }) {
  return (
    <div className="day-tabs glass">
      {days.map(day => (
        <button
          key={day}
          className={`tab-button ${day === activeDay ? 'active' : ''}`}
          onClick={() => setActiveDay(day)}
        >
          {day}
        </button>
      ))}
    </div>
  );
}
