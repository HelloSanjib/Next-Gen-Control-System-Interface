"use client";

import { Activity, BellRing, Cpu, RefreshCcw, Satellite, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { DynamicSystemLayout } from "@/components/DynamicSystemLayout";
import { IntelligentAlarmFeed } from "@/components/IntelligentAlarmFeed";
import { RoleSpecificPanels } from "@/components/RoleSpecificPanels";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { SystemHealthOverview } from "@/components/SystemHealthOverview";
import { TelemetryPanel } from "@/components/TelemetryPanel";
import { useControlRoom } from "@/context/ControlRoomContext";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/format";

export function ControlRoomDashboard() {
  const { alerts, cards, isDegraded, isLoading, lastRefresh, refreshNow, role } = useControlRoom();
  const hotAlarmCount = alerts.filter((alert) => alert.severity === "critical" || alert.severity === "high").length;

  return (
    <main className="min-h-screen px-3 py-3 text-control-text sm:px-5 lg:px-6">
      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-4">
        <header className="control-panel rounded-lg">
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm text-control-muted">
                <span className="inline-flex items-center gap-2 rounded-sm border border-process-cyan/30 bg-process-cyan/10 px-2 py-1 text-process-cyan">
                  <Satellite className="h-3.5 w-3.5" />
                  Live HMI Prototype
                </span>
                <span className="inline-flex items-center gap-2 rounded-sm border border-control-line bg-control-panel2 px-2 py-1">
                  <Activity className={cn("h-3.5 w-3.5", isLoading ? "animate-pulse text-process-cyan" : "text-process-mint")} />
                  {lastRefresh ? formatTime(lastRefresh) : "Connecting"}
                </span>
                {isDegraded && (
                  <span className="inline-flex items-center gap-2 rounded-sm border border-alarm-medium/40 bg-alarm-medium/10 px-2 py-1 text-yellow-100">
                    Local fallback
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Next-Gen Control System Interface</h1>
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
              <button type="button" title="Refresh plant frame" onClick={() => void refreshNow()} className="control-button">
                <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </header>

        <SystemHealthOverview />

        <motion.div
          key={role}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]"
        >
          <DynamicSystemLayout />
          <IntelligentAlarmFeed />
        </motion.div>

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(28rem,0.85fr)]">
          <TelemetryPanel />
          <RoleSpecificPanels />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 pb-3 text-xs text-control-muted">
          <span className="inline-flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-process-cyan" />
            Control room session · {role === "operator" ? "operator" : "engineer"} role
          </span>
          <span>72-hour hackathon demo build</span>
        </footer>
      </div>
    </main>
  );
}
