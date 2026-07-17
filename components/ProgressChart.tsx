"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = {
  stroke: "#8a7d68",
  fontSize: 10,
  fontFamily: "var(--font-jetbrains)",
  tickLine: false,
};

function TipBox({
  active,
  payload,
  label,
  unit,
  suffix,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit: string;
  suffix: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line-bright bg-surface px-3 py-2 shadow-xl">
      <div className="label mb-0.5">{label}</div>
      <div className="num text-base font-bold text-accent">
        {Math.round(payload[0].value).toLocaleString()}{" "}
        <span className="text-xs text-text-dim">{suffix || unit}</span>
      </div>
    </div>
  );
}

export function WeightChart({
  data,
  unit,
}: {
  data: { label: string; value: number }[];
  unit: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5b1f" stopOpacity={0.32} />
            <stop offset="100%" stopColor="#ff5b1f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#352d21" vertical={false} />
        <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={24} />
        <YAxis {...axis} width={38} />
        <Tooltip
          content={<TipBox unit={unit} suffix={unit} />}
          cursor={{ stroke: "#4a4030" }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#ff5b1f"
          strokeWidth={2.5}
          fill="url(#wfill)"
          dot={{ r: 2.5, fill: "#ff5b1f", strokeWidth: 0 }}
          activeDot={{ r: 4, fill: "#ff5b1f" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function VolumeChart({
  data,
  unit,
}: {
  data: { label: string; value: number }[];
  unit: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={150}>
      <BarChart data={data} margin={{ top: 8, right: 6, left: 2, bottom: 0 }}>
        <CartesianGrid stroke="#352d21" vertical={false} />
        <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={24} />
        <YAxis
          {...axis}
          width={48}
          tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
        />
        <Tooltip
          content={<TipBox unit={unit} suffix={`${unit} vol`} />}
          cursor={{ fill: "rgba(255,91,31,0.08)" }}
        />
        <Bar dataKey="value" fill="#c9451a" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
