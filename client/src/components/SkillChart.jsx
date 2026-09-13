import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#8B5CF6', '#34D399', '#F59E0B', '#EF4444', '#60A5FA'];

export default function SkillChart({ data }) {
  const chartData = data.map((item) => ({ name: item.name, value: item.score }));
  return (
    <div className="glass-card card-padding" style={{ height: 300 }}>
      <h3 style={{ marginBottom: '0.5rem', color: 'white' }}>Skill Competency Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
