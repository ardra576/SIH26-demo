import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

/**
 * ProgressChart – renders a simple line chart of provided data points.
 * Props:
 *   data: Array of objects { name: string, value: number }
 *   title: optional chart title
 */
export default function ProgressChart({ data, title = 'Learning Progress' }) {
  const chartData = data.map(item => ({ name: item.name, value: item.value }));
  return (
    <div className="glass-card card-padding" style={{ height: 300 }}>
      <h3 style={{ marginBottom: '0.5rem', color: 'white' }}>{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="name" stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
