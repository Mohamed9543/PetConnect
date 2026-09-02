import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TimeseriesPoint } from "../types";

interface ChartProps {
  title: string;
  data: TimeseriesPoint[];
  color: string;
}

function formatLabel(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export function Chart({ title, data, color }: ChartProps) {
  const chartData = data.map((point) => ({ label: formatLabel(point.date), count: point.count }));

  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      {chartData.length === 0 ? (
        <div className="empty-state">Pas de données sur cette période.</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Area type="monotone" dataKey="count" stroke={color} fill={`url(#gradient-${color.replace("#", "")})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
