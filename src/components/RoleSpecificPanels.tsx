"use client";

import { ClipboardCheck, FileText, Gauge, Route, Terminal } from "lucide-react";
import { useMemo } from "react";
import { useControlRoom } from "@/context/ControlRoomContext";
import { formatNumber, formatTime } from "@/lib/format";
import { severityDot, severityLabel } from "@/lib/severity";

export function RoleSpecificPanels() {
  const { alerts, cards, role, selectedSystem, systems } = useControlRoom();
  const orderedAlerts = useMemo(() => alerts.slice(0, 7), [alerts]);

  if (role === "engineer") {
    return (
      <section className="control-panel rounded-lg">
        <div className="flex items-center justify-between gap-3 border-b border-control-edge px-4 py-3">
          <div>
            <p className="metric-label">Engineer View</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Diagnostics and event log</h2>
          </div>
          <Terminal className="h-5 w-5 text-process-cyan" />
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-[1fr_20rem]">
          <div className="overflow-hidden rounded-md border border-control-line">
            <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
              <thead className="bg-control-panel2 text-xs uppercase text-control-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Time</th>
                  <th className="px-3 py-2 font-semibold">Severity</th>
                  <th className="px-3 py-2 font-semibold">System</th>
                  <th className="px-3 py-2 font-semibold">Signal</th>
                  <th className="px-3 py-2 font-semibold">Root hint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-control-edge bg-[#071019]">
                {orderedAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td className="px-3 py-3 font-mono text-xs text-control-muted">{formatTime(alert.timestamp)}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-2 text-xs text-control-text">
                        <span className={`h-2 w-2 rounded-full ${severityDot(alert.severity)}`} />
                        {severityLabel[alert.severity]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-control-text">{alert.systemName}</td>
                    <td className="px-3 py-3 font-mono text-xs text-control-muted">
                      {alert.signal}={alert.value}
                      {alert.unit}
                    </td>
                    <td className="px-3 py-3 text-control-muted">{alert.rootCauseHint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-md border border-control-line bg-control-panel2 p-4">
            <p className="metric-label">Selected Asset</p>
            <h3 className="mt-2 text-base font-semibold text-white">{selectedSystem?.name ?? "None"}</h3>
            <div className="mt-4 space-y-3 text-sm text-control-muted">
              <p>Owner: {selectedSystem?.owner}</p>
              <p>Area: {selectedSystem?.area}</p>
              <p>Priority score: {formatNumber(selectedSystem?.priority ?? 0)}</p>
              <p>Status: {selectedSystem?.status}</p>
              <p>Dependencies: {selectedSystem?.dependencies.join(", ")}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="control-panel rounded-lg">
      <div className="flex items-center justify-between gap-3 border-b border-control-edge px-4 py-3">
        <div>
          <p className="metric-label">Operator View</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Action queue and plant posture</h2>
        </div>
        <ClipboardCheck className="h-5 w-5 text-process-mint" />
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-3">
        <div className="rounded-md border border-control-line bg-control-panel2 p-4">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-process-cyan" />
            <p className="metric-label">Next Best Actions</p>
          </div>
          <div className="mt-4 space-y-3">
            {cards.slice(0, 3).map((card) => (
              <div key={card.id} className="border-l-2 border-process-cyan pl-3">
                <p className="text-sm font-semibold text-white">{card.primaryAction}</p>
                <p className="mt-1 text-xs text-control-muted">{card.title}</p>
              </div>
            ))}
            {cards.length === 0 && <p className="text-sm text-control-muted">No operator actions pending.</p>}
          </div>
        </div>

        <div className="rounded-md border border-control-line bg-control-panel2 p-4">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-process-mint" />
            <p className="metric-label">Systems</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-2xl font-semibold text-white">{systems.length}</p>
              <p className="text-control-muted">monitored</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{systems.filter((system) => system.status === "normal").length}</p>
              <p className="text-control-muted">normal</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-alarm-high">{systems.filter((system) => system.status === "warning").length}</p>
              <p className="text-control-muted">warning</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-alarm-critical">{systems.filter((system) => system.status === "critical").length}</p>
              <p className="text-control-muted">critical</p>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-control-line bg-control-panel2 p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-process-amber" />
            <p className="metric-label">Shift Note</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-control-text">
            {cards[0]?.impact ??
              "Plant risk is normal. Adaptive suppression keeps stable assets quiet while telemetry remains active in the background."}
          </p>
        </div>
      </div>
    </section>
  );
}
