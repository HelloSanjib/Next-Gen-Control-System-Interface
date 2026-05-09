"use client";

import { Activity, AlertTriangle, Bell, BellOff, Gauge, Layers3, ShieldCheck, Zap } from "lucide-react";
import { useMemo } from "react";
import { useControlRoom } from "@/context/ControlRoomContext";
import { compactPercent, formatNumber, formatTime } from "@/lib/format";
import { AlertVolumeChart } from "@/components/AlertVolumeChart";

export function SystemHealthOverview() {
  const {
    alerts,
    frame,
    isDegraded,
    isLoading,
    lastRefresh,
    systems,
    triage,
    notificationPermission,
    requestNotifications
  } = useControlRoom();

  const counts = useMemo(() => {
    return systems.reduce(
      (acc, system) => {
        acc[system.status] += 1;
        return acc;
      },
      { critical: 0, maintenance: 0, normal: 0, warning: 0 }
    );
  }, [systems]);

  const criticalAlerts = alerts.filter((alert) => alert.severity === "critical").length;

  return (
    <div className="flex flex-col gap-3">
      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="control-panel rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="metric-label">Plant Risk</span>
            <Gauge className="h-4 w-4 text-process-cyan" />
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-semibold text-white">{formatNumber(frame.riskScore)}</span>
            <span className="pb-1 text-sm text-control-muted">/ 100</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-sm bg-control-panel2">
            <div
              className="h-full rounded-sm bg-gradient-to-r from-process-mint via-process-amber to-alarm-critical transition-all duration-700"
              style={{ width: `${Math.max(4, frame.riskScore)}%` }}
            />
          </div>
        </div>

        <div className="control-panel rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="metric-label">AI Compression</span>
            <Layers3 className="h-4 w-4 text-process-mint" />
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-semibold text-white">{triage.cards.length}</span>
            <span className="pb-1 text-sm text-control-muted">cards from {alerts.length} alerts</span>
          </div>
          <p className="mt-3 truncate text-sm text-control-muted">
            {compactPercent(triage.suppressionRate)} suppression active
          </p>
        </div>

        <div className="control-panel rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="metric-label">Critical Surface</span>
            <AlertTriangle className="h-4 w-4 text-alarm-critical" />
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-semibold text-white">{criticalAlerts}</span>
            <span className="pb-1 text-sm text-control-muted">critical alerts</span>
          </div>
          <div className="mt-3 flex gap-2 text-xs">
            <span className="rounded-sm border border-alarm-critical/30 bg-alarm-critical/10 px-2 py-1 text-red-100">
              {counts.critical} critical
            </span>
            <span className="rounded-sm border border-alarm-high/25 bg-alarm-high/10 px-2 py-1 text-orange-100">
              {counts.warning} warning
            </span>
          </div>
        </div>

        <div className="control-panel rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="metric-label">Live State</span>
            {isDegraded ? (
              <Zap className="h-4 w-4 text-alarm-medium" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-process-mint" />
            )}
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-semibold text-white">{frame.plantLoad || "--"}</span>
            <span className="pb-1 text-sm text-control-muted">load %</span>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-control-muted">
            <Activity
              className={
                isLoading ? "h-3.5 w-3.5 animate-pulse text-process-cyan" : "h-3.5 w-3.5 text-process-mint"
              }
            />
            {lastRefresh ? formatTime(lastRefresh) : "Syncing"}
            {isDegraded ? " fallback sim" : " SSE stream"}
          </p>
        </div>
      </section>

      {/* ── Alert Volume + Notification strip ───────────────────────────── */}
      <div className="control-panel flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="metric-label">Alert Volume — last {30} ticks</p>
          <div className="mt-2 h-14">
            <AlertVolumeChart />
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <p className="metric-label">Browser Alerts</p>
          {notificationPermission === "unsupported" ? (
            <span className="text-xs text-control-muted">Not supported</span>
          ) : notificationPermission === "granted" ? (
            <span className="inline-flex items-center gap-2 rounded-sm border border-process-mint/30 bg-process-mint/10 px-2 py-1 text-xs text-process-mint">
              <Bell className="h-3.5 w-3.5" />
              Critical alerts on
            </span>
          ) : notificationPermission === "denied" ? (
            <span className="inline-flex items-center gap-2 rounded-sm border border-control-line bg-control-panel2 px-2 py-1 text-xs text-control-muted">
              <BellOff className="h-3.5 w-3.5" />
              Blocked by browser
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void requestNotifications()}
              className="control-button h-8 gap-1.5 px-3 text-xs"
            >
              <Bell className="h-3.5 w-3.5" />
              Enable notifications
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
