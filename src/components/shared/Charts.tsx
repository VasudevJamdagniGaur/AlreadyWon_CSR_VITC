"use client";

import { Badge } from "@/components/ui/badge";
import { EmptyPlaceholder } from "@/components/shared/EmptyPlaceholder";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

const NAVY = ["#102a43", "#243b53", "#486581", "#829ab1", "#bcccdc", "#627d98"];

export function ChartEmpty({ message = "No data available" }: { message?: string }) {
  return <EmptyPlaceholder title={message} description="Data will appear once projects are analyzed." />;
}

export function DonutChart({
  data,
  dataKey = "value",
  nameKey = "name",
}: {
  data: { name: string; value: number }[];
  dataKey?: string;
  nameKey?: string;
}) {
  if (!data.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey={dataKey} nameKey={nameKey} innerRadius={55} outerRadius={80} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={NAVY[i % NAVY.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({
  data,
  xKey,
  yKey,
  color = "#243b53",
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  color?: string;
}) {
  if (!data.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleLineChart({
  data,
  lines,
}: {
  data: Record<string, string | number>[];
  lines: { key: string; color: string; name?: string }[];
}) {
  if (!data.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} name={l.name ?? l.key} strokeWidth={2} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleAreaChart({
  data,
  dataKey,
  color = "#486581",
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  color?: string;
}) {
  if (!data.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ImpactScatterChart({
  data,
}: {
  data: { name: string; investment: number; impact: number; beneficiaries: number; risk: string }[];
}) {
  if (!data.length) return <ChartEmpty />;
  const riskColor = (r: string) =>
    r === "HIGH" || r === "CRITICAL" ? "#dc2626" : r === "MEDIUM" ? "#d97706" : "#16a34a";

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="investment" name="Investment" tick={{ fontSize: 11 }} unit=" ₹" />
          <YAxis type="number" dataKey="impact" name="Impact" tick={{ fontSize: 11 }} />
          <ZAxis type="number" dataKey="beneficiaries" range={[60, 400]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={data}>
            {data.map((d, i) => (
              <Cell key={i} fill={riskColor(d.risk)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">X = Investment</Badge>
        <Badge variant="outline">Y = Expected Impact</Badge>
        <Badge variant="outline">Size = Beneficiaries</Badge>
        <Badge variant="outline">Color = Risk</Badge>
      </div>
    </div>
  );
}
