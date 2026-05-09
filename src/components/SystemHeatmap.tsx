"use client";

import { useControlRoom } from "@/context/ControlRoomContext";
import type { MetricSnapshot } from "@/types/industrial";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

const metrics: Array<{ key: keyof MetricSnapshot; label: string; unit: string; warnHigh?: number; critHigh?: number; warnLow?: number; critLow?: number }> = [
  { key: "temperature", label: "Temp", unit: "°C", warnHigh: 72, critHigh: 92 },
  { key: "pressure",    label: "Pres", unit: "bar", warnLow: 4.2, critLow: 3.25, warnHigh: 8.85, critHigh: 9.55 },
  { key: "vibration",  label: "Vib",  unit: "mm/s", warnHigh: 3.75, critHigh: 5.7 },
  { key: "flowRate",   label: "Flow", unit: "%",   warnLow: 62, critLow: 48 },
  { key: "powerLoad",  label: "Load", unit: "%",   warnHigh: 88, critHigh: 95 },
  { key: "efficiency", label: "Eff",  unit: "%",   warnLow: 78, critLow: 68 }
];

function cellColor(value: number, m: typeof metrics[number]): string {
  const isCrit =
    (m.critHigh !== undefined && value >= m.critHigh) ||
    (m.critLow  !== undefined && value <= m.critLow);
  const isWarn =
    (m.warnHigh !== undefined && value >= m.warnHigh) ||
    (m.warnLow  !== undefined && value <= m.warnLow);

  if (isCrit) return "bg-alarm-critical/30 text-red-100 border-alarm-critical/40";
  if (isWarn) return "bg-alarm-high/20 text-orange-100 border-alarm-high/30";
  return "bg-process-mint/10 text-green-100 border-process-mint/20";
}

export function SystemHeatmap() {
  const { systems } = useControlRoom();

  return (
    <section className="control-panel rounded-lg overflow-x-auto">
      <div className="border-b border-control-edge px-4 py-3">
        <p className="metric-label">System Heatmap</p>
        <h2 className="mt-1 text-lg font-semibold text-white">All assets · all metrics at a glance</h2>
      </div>

      <div className="p-4">
        <table className="w-full min-w-[44rem] border-collapse text-xs">
          <thead>
            <tr>
              <th className="pb-2 pr-3 text-left text-control-muted font-semibold">System</th>
              <th className="pb-2 pr-3 text-left text-control-muted font-semibold">Area</th>
              {metrics.map((m) => (
                <th key={m.key} className="pb-2 px-1 text-center text-control-muted font-semibold uppercase tracking-wider">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-control-edge">
            {systems.map((system) => (
              <tr key={system.id} className="hover:bg-control-panel2/60 transition-colors">
                <td className="py-2 pr-3 font-semibold text-white whitespace-nowrap">{system.name}</td>
                <td className="py-2 pr-3 text-control-muted whitespace-nowrap">{system.area}</td>
                {metrics.map((m) => {
                  const val = system.metrics[m.key];
                  return (
                    <td key={m.key} className="py-2 px-1 text-center">
                      <span className={cn(
                        "inline-block rounded border px-2 py-0.5 font-mono font-semibold tabular-nums",
                        cellColor(val, m)
                      )}>
                        {formatNumber(val, m.key === "pressure" || m.key === "vibration" ? 1 : 0)}
                        <span className="ml-0.5 text-[0.6rem] opacity-70">{m.unit}</span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-control-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded bg-process-mint/30 border border-process-mint/30" /> Normal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded bg-alarm-high/25 border border-alarm-high/30" /> Warning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded bg-alarm-critical/30 border border-alarm-critical/40" /> Critical
          </span>
        </div>
      </div>
    </section>
  );
}
