"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Clock3, Layers3, ShieldAlert, Sparkles } from "lucide-react";
import { useControlRoom } from "@/context/ControlRoomContext";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/format";
import { severityDot, severityLabel, severityTone } from "@/lib/severity";

export function IntelligentAlarmFeed() {
  const { acknowledgeCard, cards, role, setSelectedSystemId, triage } = useControlRoom();

  return (
    <section className="control-panel flex min-h-[36rem] flex-col rounded-lg">
      <div className="border-b border-control-edge px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="metric-label">AI Triage Feed</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Action cards</h2>
          </div>
          <Sparkles className="h-5 w-5 text-process-mint" />
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-control-muted">{triage.narrative}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <AnimatePresence mode="popLayout">
          {cards.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-lg border border-control-line bg-control-panel2 p-4 text-sm text-control-muted"
            >
              No active grouped alarms for this role.
            </motion.div>
          ) : (
            cards.map((card) => {
              const acknowledged = card.status === "acknowledged";

              return (
                <motion.article
                  key={card.id}
                  layout
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: acknowledged ? 0.62 : 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.28 }}
                  className={cn("rounded-lg border p-4", severityTone(card.severity), acknowledged && "grayscale")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full", severityDot(card.severity))} />
                        <span className="text-xs font-semibold uppercase text-control-muted">{severityLabel[card.severity]}</span>
                        <span className="rounded-sm border border-white/10 bg-black/20 px-1.5 py-0.5 text-xs text-control-muted">
                          {card.count} alerts
                        </span>
                        <span className="rounded-sm border border-white/10 bg-black/20 px-1.5 py-0.5 text-xs text-control-muted">
                          {card.confidence}% confidence
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-white">{card.title}</h3>
                    </div>
                    <ShieldAlert className="h-5 w-5 shrink-0 text-current" />
                  </div>

                  <p className="mt-3 text-sm leading-6 text-control-text">{card.summary}</p>

                  <div className="mt-3 grid gap-2 text-sm">
                    <div className="rounded-md border border-white/10 bg-black/20 p-3">
                      <p className="metric-label">Impact</p>
                      <p className="mt-1 text-control-text">{card.impact}</p>
                    </div>
                    <div className="rounded-md border border-white/10 bg-black/20 p-3">
                      <p className="metric-label">Primary Action</p>
                      <p className="mt-1 font-semibold text-white">{card.primaryAction}</p>
                    </div>
                  </div>

                  {role === "engineer" && (
                    <div className="mt-3 rounded-md border border-white/10 bg-black/20 p-3">
                      <p className="metric-label">Evidence</p>
                      <ul className="mt-2 space-y-1 text-xs text-control-muted">
                        {card.evidence.map((item) => (
                          <li key={item} className="truncate">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2 text-xs text-control-muted">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>ETA {card.etaToImpact}</span>
                      <span>·</span>
                      <span>{formatTime(card.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Focus affected system"
                        onClick={() => setSelectedSystemId(card.affectedSystemIds[0])}
                        className="control-button h-8 px-2"
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Focus</span>
                      </button>
                      <button
                        type="button"
                        title="Acknowledge grouped alarm"
                        onClick={() => acknowledgeCard(card.id)}
                        disabled={acknowledged}
                        className="control-button h-8 px-2 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="sr-only">Acknowledge</span>
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-control-edge px-4 py-3 text-xs text-control-muted">
        <div className="flex items-center gap-2">
          <Layers3 className="h-3.5 w-3.5 text-process-cyan" />
          {triage.suppressedNormalCount} normal systems held in background view
        </div>
      </div>
    </section>
  );
}
