"use client";

import * as React from "react";
import { useState, useEffect } from "react";

const TeacherDashboardPage = () => {
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001?channel=teacher');

    ws.onopen = () => {
      console.log('Teacher dashboard connected to WebSocket');
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'SEVERE_ALERT') {
        setAlerts(prev => [...prev, message.payload.message]);
      }
    };

    ws.onclose = () => {
      console.log('Teacher dashboard disconnected from WebSocket');
    };

    // Simulate an alert for demonstration
    const timer = setTimeout(() => {
        fetch('http://localhost:3001/alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Group 1 has been silent for a long time.' }),
        });
    }, 5000);

    return () => {
      ws.close();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`bg-white p-6 rounded-lg shadow-md ${alerts.length > 0 ? 'border-red-500 border-2' : ''}`}>
          <h2 className="text-xl font-bold">Group 1</h2>
          <p className="mt-2">Status: In Progress</p>
          <div className="mt-1">
            <p className="font-bold">Alerts:</p>
            {alerts.length > 0 ? (
              <ul>
                {alerts.map((alert, index) => (
                  <li key={index} className="text-red-500">{alert}</li>
                ))}
              </ul>
            ) : (
              <p>None</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;