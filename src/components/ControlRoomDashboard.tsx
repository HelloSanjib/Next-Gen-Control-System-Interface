"use client";

import { Activity, BellRing, Cpu, LayoutGrid, Map, RefreshCcw, Satellite, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { DynamicSystemLayout } from "@/components/DynamicSystemLayout";
import { IntelligentAlarmFeed } from "@/components/IntelligentAlarmFeed";
import { RoleSpecificPanels } from "@/components/RoleSpecificPanels";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { SystemHealthOverview } from "@/components/SystemHealthOverview";
import { SystemHeatmap } from "@/components/SystemHeatmap";
import { TelemetryPanel } from "@/components/TelemetryPanel";
import { useControlRoom } from "@/context/ControlRoomContext";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/format";

type ViewTab = "map" | "heatmap";

const viewTabs: Array<{ id: ViewTab; label: string; Icon: typeof Map }> = [
  { id: "map", label: "Plant Map", Icon: Map },
  { id: "heatmap", label: "Heatmap", Icon: LayoutGrid }
];

export function ControlRoomDashboard() {
  const { alerts, cards, isDegraded, isLoading, lastRefresh, refreshNow, role } = useControlRoom();
  const hotAlarmCount = alerts.filter(
    (alert) => alert.severity === "critical" || alert.severity === "high"
  ).length;
  const [activeView, setActiveView] = useState<ViewTab>("map");

  return (
    <main className="min-h-screen px-3 py-3 text-control-text sm:px-5 lg:px-6">
      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-4">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="control-panel rounded-lg">
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm text-control-muted">
                <span className="inline-flex items-center gap-2 rounded-sm border border-process-cyan/30 bg-process-cyan/10 px-2 py-1 text-process-cyan">
                  <Satellite className="h-3.5 w-3.5" />
                  Live HMI · SSE Stream
                </span>
                <span className="inline-flex items-center gap-2 rounded-sm border border-control-line bg-control-panel2 px-2 py-1">
                  <Activity
                    className={cn(
                      "h-3.5 w-3.5",
                      isLoading ? "animate-pulse text-process-cyan" : "text-process-mint"
                    )}
                  />
                  {lastRefresh ? formatTime(lastRefresh) : "Connecting"}
                </span>
                {isDegraded && (
                  <span className="inline-flex items-center gap-2 rounded-sm border border-alarm-medium/40 bg-alarm-medium/10 px-2 py-1 text-yellow-100">
                    Local fallback
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                Next-Gen Control System Interface
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-control-muted">
                ABB Accelerator demo cell · Cooling, utilities, production, thermal, and electrical systems online.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-md border border-control-line bg-control-panel2 px-3 py-2">
                <p className="metric-label">Hot Alarms</p>
                <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-white">
                  <BellRing className="h-5 w-5 text-alarm-critical" />
                  {hotAlarmCount}
                </p>
              </div>
              <div className="rounded-md border border-control-line bg-control-panel2 px-3 py-2">
                <p className="metric-label">Cards</p>
                <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-white">
                  <ShieldAlert className="h-5 w-5 text-process-amber" />
                  {cards.length}
                </p>
              </div>
              <RoleSwitcher />
              <button
                type="button"
                title="Refresh plant frame"
                onClick={() => void refreshNow()}
                className="control-button"
              >
                <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── System Health + Volume + Notifications ──────────────────────── */}
        <SystemHealthOverview />

        {/* ── View tab bar ────────────────────────────────────────────────── */}
        <div className="inline-flex self-start rounded-md border border-control-line bg-control-panel p-1">
          {viewTabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveView(id)}
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-[5px] px-4 text-sm font-semibold transition",
                activeView === id
                  ? "bg-process-cyan text-slate-950 shadow-[0_0_18px_rgba(49,214,255,0.22)]"
                  : "text-control-muted hover:bg-control-panel2 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Main content area (animated on tab or role change) ───────────── */}
        <motion.div
          key={`${activeView}-${role}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {activeView === "map" ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
              <DynamicSystemLayout />
              <IntelligentAlarmFeed />
            </div>
          ) : (
            <SystemHeatmap />
          )}
        </motion.div>

        {/* ── Telemetry + Role panels ──────────────────────────────────────── */}
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(28rem,0.85fr)]">
          <TelemetryPanel />
          <RoleSpecificPanels />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 pb-3 text-xs text-control-muted">
          <span className="inline-flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-process-cyan" />
            Control room session · {role === "operator" ? "operator" : "engineer"} role
          </span>
          <span>SSE-powered live stream · predictive anomaly detection active</span>
        </footer>
      </div>
    </main>
  );
}
