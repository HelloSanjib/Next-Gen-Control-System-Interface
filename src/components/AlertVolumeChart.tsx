"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip } from "recharts";
import { useControlRoom } from "@/context/ControlRoomContext";

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-control-line bg-control-panel px-2 py-1.5 text-xs">
      <p className="text-control-muted">Tick {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function AlertVolumeChart() {
  const { alertHistory } = useControlRoom();

  if (alertHistory.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-control-muted">
        Collecting data…
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={alertHistory} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={6} barGap={1}>
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(49,214,255,0.08)" }} />
        <Bar dataKey="high" name="High" fill="#ff8a3d" stackId="a" radius={[0, 0, 0, 0]} />
        <Bar dataKey="critical" name="Critical" fill="#ff3b4f" stackId="a" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
