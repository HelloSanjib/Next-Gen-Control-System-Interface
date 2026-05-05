"use client";

import { Activity, Cpu, Gauge, Thermometer, Waves, Zap } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useControlRoom } from "@/context/ControlRoomContext";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

const metricRows = [
  { key: "temperature", label: "Temp", unit: "C", Icon: Thermometer },
  { key: "pressure", label: "Pressure", unit: "bar", Icon: Gauge },
  { key: "vibration", label: "Vibration", unit: "mm/s", Icon: Activity },
  { key: "flowRate", label: "Flow", unit: "%", Icon: Waves },
  { key: "powerLoad", label: "Load", unit: "%", Icon: Zap },
  { key: "efficiency", label: "Eff", unit: "%", Icon: Cpu }
] as const;

export function TelemetryPanel() {
  const { selectedSystem } = useControlRoom();

  if (!selectedSystem) {
    return null;
  }

  return (
    <section className="control-panel rounded-lg">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-control-edge px-4 py-3">
        <div className="min-w-0">
          <p className="metric-label">Focused Telemetry</p>
          <h2 className="mt-1 truncate text-lg font-semibold text-white">{selectedSystem.name}</h2>
          <p className="mt-1 truncate text-sm text-control-muted">{selectedSystem.aiSummary}</p>
        </div>
        <div className="rounded-md border border-control-line bg-control-panel2 px-3 py-2 text-right">
          <p className="metric-label">Impact</p>
          <p className="mt-1 text-sm font-semibold text-white">{selectedSystem.etaToImpact}</p>
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[20rem_1fr]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
          {metricRows.map(({ key, label, unit, Icon }) => (
            <div key={key} className="rounded-md border border-control-line bg-control-panel2 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-control-muted">{label}</span>
                <Icon className="h-4 w-4 text-process-cyan" />
              </div>
              <p className="mt-2 text-xl font-semibold text-white">
                {formatNumber(selectedSystem.metrics[key], key === "pressure" || key === "vibration" ? 1 : 0)}
                <span className="ml-1 text-xs text-control-muted">{unit}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="h-[19rem] min-w-0 rounded-md border border-control-line bg-[#071019] p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={selectedSystem.trend} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(45,65,83,0.48)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: "#8394a5", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#8394a5", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#0b1118",
                  border: "1px solid #2d4153",
                  borderRadius: 6,
                  color: "#e5eef5"
                }}
                labelStyle={{ color: "#8394a5" }}
              />
              <Line type="monotone" dataKey="temperature" stroke="#ff6b62" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pressure" stroke="#31d6ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="vibration" stroke="#ffd24d" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="efficiency" stroke="#35d08f" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-control-edge px-4 py-3">
        {selectedSystem.dependencies.map((dependency) => (
          <span
            key={dependency}
            className={cn("rounded-sm border border-control-line bg-control-panel2 px-2 py-1 text-xs text-control-muted")}
          >
            linked: {dependency}
          </span>
        ))}
      </div>
    </section>
  );
}
