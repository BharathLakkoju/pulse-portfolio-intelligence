"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function ValueHistoryChart({ data, currency }: { data: Array<{ date: string; value: number }>; currency: string }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5b8cff" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#5b8cff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#263041" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#93a2b8" }} minTickGap={40} />
          <YAxis tick={{ fontSize: 10, fill: "#93a2b8" }} width={60} tickFormatter={(v) => new Intl.NumberFormat("en-IN", { notation: "compact" }).format(v)} />
          <Tooltip
            formatter={(value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value)}
            contentStyle={{ background: "#121821", border: "1px solid #263041", borderRadius: 8, fontSize: 12 }}
          />
          <Area type="monotone" dataKey="value" stroke="#5b8cff" fill="url(#valueGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
