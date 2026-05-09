"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { emptySystems } from "@/data/industrialModel";
import { buildMockFrame } from "@/lib/alertSimulator";
import { triageAlerts } from "@/lib/triageEngine";
import { detectAnomaly } from "@/lib/anomalyDetector";
import type {
  AlertHistoryEntry,
  AnomalyPrediction,
  IndustrialAlert,
  IndustrialSystem,
  MockFrame,
  Role,
  TriageCard,
  TriageResponse
} from "@/types/industrial";

interface ControlRoomContextValue {
  role: Role;
  setRole: (role: Role) => void;
  frame: MockFrame;
  systems: IndustrialSystem[];
  alerts: IndustrialAlert[];
  cards: TriageCard[];
  triage: TriageResponse;
  selectedSystemId: string;
  setSelectedSystemId: (systemId: string) => void;
  selectedSystem?: IndustrialSystem;
  isLoading: boolean;
  isDegraded: boolean;
  lastRefresh?: string;
  acknowledgeCard: (cardId: string) => void;
  refreshNow: () => Promise<void>;
  alertHistory: AlertHistoryEntry[];
  anomalyMap: Record<string, AnomalyPrediction>;
  notificationPermission: NotificationPermission | "unsupported";
  requestNotifications: () => Promise<void>;
}

const initialFrame: MockFrame = {
  cursor: 0,
  generatedAt: "1970-01-01T00:00:00.000Z",
  plantLoad: 0,
  riskScore: 0,
  systems: emptySystems,
  alerts: []
};

const initialTriage: TriageResponse = {
  cards: [],
  groupedAlertCount: 0,
  suppressedNormalCount: emptySystems.length,
  suppressionRate: 100,
  narrative: "Waiting for live plant data."
};

const HISTORY_MAX = 30;

const ControlRoomContext = createContext<ControlRoomContextValue | undefined>(undefined);

// ─── local fallback helpers (used when SSE fails) ──────────────────────────

async function fetchTriage(alerts: IndustrialAlert[], systems: IndustrialSystem[]) {
  const response = await fetch("/api/triage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alerts, systems })
  });
  if (!response.ok) throw new Error(`Triage route failed with ${response.status}`);
  return (await response.json()) as TriageResponse;
}

// ─── provider ──────────────────────────────────────────────────────────────

export function ControlRoomProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("operator");
  const [frame, setFrame] = useState<MockFrame>(initialFrame);
  const [triage, setTriage] = useState<TriageResponse>(initialTriage);
  const [selectedSystemId, setSelectedSystemId] = useState(emptySystems[0]?.id ?? "");
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDegraded, setIsDegraded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>();
  const [alertHistory, setAlertHistory] = useState<AlertHistoryEntry[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");

  const prevCardIdsRef = useRef<Set<string>>(new Set());
  const tickLabelRef = useRef(0);

  // ── Notification permission state sync ────────────────────────────────────
  useEffect(() => {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
    } else {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotifications = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
  }, []);

  // ── Shared state updater called on every new frame ─────────────────────────
  const applyFrame = useCallback(
    (nextFrame: MockFrame, nextTriage: TriageResponse, degraded: boolean) => {
      setFrame(nextFrame);
      setTriage(nextTriage);
      setLastRefresh(nextFrame.generatedAt);
      setIsDegraded(degraded);
      setIsLoading(false);

      // maintain selected system across refreshes
      setSelectedSystemId((current) => {
        if (current && nextFrame.systems.some((s) => s.id === current)) return current;
        return (
          [...nextFrame.systems].sort((a, b) => b.priority - a.priority)[0]?.id ?? current
        );
      });

      // append to alert history ring-buffer
      tickLabelRef.current += 1;
      const entry: AlertHistoryEntry = {
        label: String(tickLabelRef.current),
        count: nextFrame.alerts.length,
        critical: nextFrame.alerts.filter((a) => a.severity === "critical").length,
        high: nextFrame.alerts.filter((a) => a.severity === "high").length
      };
      setAlertHistory((prev) => {
        const next = [...prev, entry];
        return next.length > HISTORY_MAX ? next.slice(next.length - HISTORY_MAX) : next;
      });

      // fire browser notification for brand-new critical triage cards
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const currentIds = new Set(nextTriage.cards.map((c) => c.id));
        for (const card of nextTriage.cards) {
          if (
            card.severity === "critical" &&
            !prevCardIdsRef.current.has(card.id)
          ) {
            new Notification("⚠️ Critical Alarm — Control Room", {
              body: `${card.title}: ${card.impact}`,
              icon: "/favicon.ico",
              tag: card.id
            });
          }
        }
        prevCardIdsRef.current = currentIds;
      }
    },
    []
  );

  // ── SSE connection ─────────────────────────────────────────────────────────
  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      setIsLoading(true);
      es = new EventSource("/api/stream");

      es.onmessage = (event: MessageEvent<string>) => {
        try {
          const { frame: f, triage: t } = JSON.parse(event.data) as {
            frame: MockFrame;
            triage: TriageResponse;
          };
          applyFrame(f, t, false);
        } catch {
          // malformed payload — ignore
        }
      };

      es.onerror = () => {
        es?.close();
        es = null;
        // fallback: run one local simulation tick then retry SSE in 8s
        const fallbackFrame = buildMockFrame(tickLabelRef.current);
        const fallbackTriage = triageAlerts({
          alerts: fallbackFrame.alerts,
          systems: fallbackFrame.systems
        });
        applyFrame(fallbackFrame, fallbackTriage, true);
        retryTimeout = setTimeout(connect, 8000);
      };
    };

    connect();

    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, [applyFrame]);

  // ── Manual refresh (fallback to REST if SSE is alive or not) ─────────────
  const refreshNow = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/alerts?cursor=${tickLabelRef.current}`, {
        cache: "no-store"
      });
      if (!response.ok) throw new Error("alert route failed");
      const nextFrame = (await response.json()) as MockFrame;
      const nextTriage = await fetchTriage(nextFrame.alerts, nextFrame.systems);
      applyFrame(nextFrame, nextTriage, false);
    } catch {
      const fallbackFrame = buildMockFrame(tickLabelRef.current);
      const fallbackTriage = triageAlerts({
        alerts: fallbackFrame.alerts,
        systems: fallbackFrame.systems
      });
      applyFrame(fallbackFrame, fallbackTriage, true);
    }
  }, [applyFrame]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const visibleAlerts = useMemo(
    () =>
      frame.alerts
        .filter((a) => a.roleVisibility.includes(role))
        .map((a) => ({ ...a, acknowledged: acknowledgedAlertIds.has(a.id) })),
    [acknowledgedAlertIds, frame.alerts, role]
  );

  const visibleCards = useMemo(() => {
    const visibleAlertIds = new Set(visibleAlerts.map((a) => a.id));
    return triage.cards
      .filter((card) => card.alertIds.some((id) => visibleAlertIds.has(id)))
      .map((card) => ({
        ...card,
        status: card.alertIds.every((id) => acknowledgedAlertIds.has(id))
          ? ("acknowledged" as const)
          : card.status
      }));
  }, [acknowledgedAlertIds, triage.cards, visibleAlerts]);

  const selectedSystem = useMemo(
    () => frame.systems.find((s) => s.id === selectedSystemId) ?? frame.systems[0],
    [frame.systems, selectedSystemId]
  );

  const anomalyMap = useMemo<Record<string, AnomalyPrediction>>(
    () => Object.fromEntries(frame.systems.map((s) => [s.id, detectAnomaly(s)])),
    [frame.systems]
  );

  const acknowledgeCard = useCallback(
    (cardId: string) => {
      const card = triage.cards.find((c) => c.id === cardId);
      if (!card) return;
      setAcknowledgedAlertIds((current) => {
        const next = new Set(current);
        card.alertIds.forEach((id) => next.add(id));
        return next;
      });
    },
    [triage.cards]
  );

  const value = useMemo<ControlRoomContextValue>(
    () => ({
      role,
      setRole,
      frame,
      systems: frame.systems,
      alerts: visibleAlerts,
      cards: visibleCards,
      triage,
      selectedSystemId,
      setSelectedSystemId,
      selectedSystem,
      isLoading,
      isDegraded,
      lastRefresh,
      acknowledgeCard,
      refreshNow,
      alertHistory,
      anomalyMap,
      notificationPermission,
      requestNotifications
    }),
    [
      acknowledgeCard,
      alertHistory,
      anomalyMap,
      frame,
      isDegraded,
      isLoading,
      lastRefresh,
      notificationPermission,
      refreshNow,
      requestNotifications,
      role,
      selectedSystem,
      selectedSystemId,
      triage,
      visibleAlerts,
      visibleCards
    ]
  );

  return <ControlRoomContext.Provider value={value}>{children}</ControlRoomContext.Provider>;
}

export function useControlRoom() {
  const context = useContext(ControlRoomContext);
  if (!context) {
    throw new Error("useControlRoom must be used within ControlRoomProvider");
  }
  return context;
}
