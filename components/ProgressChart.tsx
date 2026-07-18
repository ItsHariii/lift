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
  decimals = 0,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit: string;
  suffix: string;
  decimals?: number;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-lg border border-line-bright bg-surface px-3 py-2 shadow-xl">
      <div className="label mb-0.5">{label}</div>
      <div className="num text-base font-bold text-accent">
        {decimals > 0
          ? value.toFixed(decimals)
          : Math.round(value).toLocaleString()}{" "}
        <span className="text-xs text-text-dim">{suffix || unit}</span>
      </div>
    </div>
  );
}

export function WeightChart({
  data,
  unit,
  color = "#ff5b1f",
  gradientId = "wfill",
  decimals = 0,
  domain,
}: {
  data: { label: string; value: number }[];
  unit: string;
  color?: string;
  gradientId?: string;
  decimals?: number;
  domain?: [number | string, number | string];
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#352d21" vertical={false} />
        <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={24} />
        <YAxis {...axis} width={38} domain={domain} />
        <Tooltip
          content={<TipBox unit={unit} suffix={unit} decimals={decimals} />}
          cursor={{ stroke: "#4a4030" }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 4, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export const GROUP_COLORS = [
  "#ff5b1f",
  "#f2b53c",
  "#5f9bd4",
  "#6fbf73",
  "#a97fd4",
  "#d46f93",
  "#8a7d68",
];

function StackTip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((row) => row.value > 0).reverse();
  const total = rows.reduce((a, row) => a + row.value, 0);
  return (
    <div className="rounded-lg border border-line-bright bg-surface px-3 py-2 shadow-xl">
      <div className="label mb-1">wk {label}</div>
      {rows.map((row) => (
        <div key={row.name} className="num flex items-center gap-1.5 text-xs">
          <span
            className="h-2 w-2 rounded-[3px]"
            style={{ background: row.color }}
          />
          <span className="text-text-dim">{row.name}</span>
          <span className="ml-auto pl-3 font-bold">
            {Math.round(row.value).toLocaleString()}
          </span>
        </div>
      ))}
      <div className="num mt-1 border-t border-line pt-1 text-xs font-bold text-accent">
        {Math.round(total).toLocaleString()} {unit}
      </div>
    </div>
  );
}

/** Weekly tonnage stacked by muscle group. */
export function MuscleVolumeChart({
  data,
  groups,
  unit,
}: {
  data: Record<string, number | string>[];
  groups: string[];
  unit: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 8, right: 6, left: 2, bottom: 0 }}>
        <CartesianGrid stroke="#352d21" vertical={false} />
        <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={24} />
        <YAxis
          {...axis}
          width={48}
          tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
        />
        <Tooltip
          content={<StackTip unit={unit} />}
          cursor={{ fill: "rgba(255,91,31,0.08)" }}
        />
        {groups.map((group, index) => (
          <Bar
            key={group}
            dataKey={group}
            stackId="volume"
            fill={GROUP_COLORS[index % GROUP_COLORS.length]}
            radius={index === groups.length - 1 ? [3, 3, 0, 0] : undefined}
          />
        ))}
      </BarChart>
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
