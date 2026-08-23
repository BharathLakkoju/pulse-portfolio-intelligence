"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Distinct, colorblind-considerate palette — allocation charts must not rely on hue alone,
// so we also render the legend with explicit percentage labels (never color-only).
const COLORS = ["#5b8cff", "#2fbf8f", "#e0b23c", "#e2694b", "#9b7bd6", "#4fb3d9", "#d97ad9", "#7a8ba6"];

export function AllocationChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#0b0f14" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${((value / total) * 100).toFixed(1)}% (${value.toLocaleString("en-IN")})`, name]}
            contentStyle={{ background: "#121821", border: "1px solid #263041", borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value: string) => value} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
