"use client";

import {
  AlertTriangle,
  Box,
  Cpu,
  Fan,
  Gauge,
  PlugZap,
  RadioTower,
  Snowflake,
  Thermometer,
  Waves
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useControlRoom } from "@/context/ControlRoomContext";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { IndustrialSystem, SystemKind, SystemStatus } from "@/types/industrial";

const iconByKind: Record<SystemKind, typeof Gauge> = {
  boiler: Thermometer,
  chiller: Snowflake,
  compressor: Fan,
  line: Waves,
  power: PlugZap,
  pump: Gauge,
  robot: Cpu,
  tank: Box
};

function nodeTone(status: SystemStatus) {
  switch (status) {
    case "critical":
      return "border-alarm-critical bg-alarm-critical/20 text-red-50 shadow-critical";
    case "warning":
      return "border-alarm-high/70 bg-alarm-high/15 text-orange-50 shadow-high";
    case "maintenance":
      return "border-alarm-low/50 bg-alarm-low/10 text-sky-50";
    default:
      return "border-control-line bg-control-panel2/90 text-control-muted";
  }
}

function laneTone(status: SystemStatus) {
  switch (status) {
    case "critical":
      return "rgba(255, 59, 79, 0.62)";
    case "warning":
      return "rgba(255, 138, 61, 0.46)";
    default:
      return "rgba(49, 214, 255, 0.18)";
  }
}

function findSystem(systems: IndustrialSystem[], id: string) {
  return systems.find((system) => system.id === id);
}

export function DynamicSystemLayout() {
  const { selectedSystemId, setSelectedSystemId, systems } = useControlRoom();
  const prioritized = useMemo(() => [...systems].sort((a, b) => b.priority - a.priority), [systems]);
  const topSystems = prioritized.slice(0, 4);
  const normalSystems = systems.filter((system) => system.status === "normal");

  return (
    <section className="control-panel min-h-[36rem] overflow-hidden rounded-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-control-edge px-4 py-3">
        <div>
          <p className="metric-label">Adaptive System Map</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Priority routed plant view</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-control-muted">
          <RadioTower className="h-4 w-4 text-process-cyan" />
          {normalSystems.length} normal systems suppressed
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_18rem]">
        <div className="relative min-h-[30rem] overflow-hidden border-b border-control-edge bg-[linear-gradient(rgba(45,65,83,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(45,65,83,0.18)_1px,transparent_1px)] bg-[size:36px_36px] lg:border-b-0 lg:border-r">
          <div className="pointer-events-none absolute inset-x-0 top-6 h-px signal-line animate-scan opacity-50" />
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {systems.flatMap((system) =>
              system.dependencies.map((dependency) => {
                const target = findSystem(systems, dependency);
                if (!target) {
                  return null;
                }

                return (
                  <line
                    key={`${system.id}-${dependency}`}
                    x1={system.x}
                    y1={system.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={laneTone(system.status === "normal" ? target.status : system.status)}
                    strokeWidth={system.status === "critical" || target.status === "critical" ? 0.55 : 0.28}
                    strokeDasharray={system.status === "normal" && target.status === "normal" ? "1.4 1.6" : "0"}
                  />
                );
              })
            )}
          </svg>

          {systems.map((system) => {
            const Icon = iconByKind[system.kind];
            const active = selectedSystemId === system.id;
            const critical = system.status === "critical";

            return (
              <motion.button
                key={system.id}
                type="button"
                title={`${system.name} ${system.status}`}
                onClick={() => setSelectedSystemId(system.id)}
                className={cn(
                  "absolute flex min-h-16 w-[9.5rem] -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-process-cyan",
                  nodeTone(system.status),
                  active && "ring-2 ring-process-cyan",
                  system.status === "normal" && !active && "opacity-55 hover:opacity-90"
                )}
                style={{ left: `${system.x}%`, top: `${system.y}%` }}
                animate={critical ? { scale: [1, 1.035, 1] } : { scale: 1 }}
                transition={critical ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : undefined}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/30">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{system.name}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs capitalize text-control-muted">
                    {critical && <AlertTriangle className="h-3.5 w-3.5 text-alarm-critical" />}
                    {system.status} · P{formatNumber(system.priority)}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>

        <aside className="bg-control-panel2/50 p-4">
          <p className="metric-label">Now Prioritized</p>
          <div className="mt-3 space-y-3">
            {topSystems.map((system, index) => (
              <button
                key={system.id}
                type="button"
                title={`Focus ${system.name}`}
                onClick={() => setSelectedSystemId(system.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-3 text-left transition hover:border-process-cyan/60",
                  selectedSystemId === system.id ? "border-process-cyan bg-process-cyan/10" : "border-control-line bg-control-panel"
                )}
              >
                <span className="min-w-0">
                  <span className="text-xs font-semibold text-control-muted">0{index + 1}</span>
                  <span className="ml-2 text-sm font-semibold text-white">{system.name}</span>
                  <span className="mt-1 block truncate text-xs text-control-muted">{system.aiSummary}</span>
                </span>
                <span className="text-lg font-semibold text-white">{formatNumber(system.priority)}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
