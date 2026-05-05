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
import type { IndustrialAlert, IndustrialSystem, MockFrame, Role, TriageCard, TriageResponse } from "@/types/industrial";

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

const ControlRoomContext = createContext<ControlRoomContextValue | undefined>(undefined);

async function fetchTriage(alerts: IndustrialAlert[], systems: IndustrialSystem[]) {
  const response = await fetch("/api/triage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ alerts, systems })
  });

  if (!response.ok) {
    throw new Error(`Triage route failed with ${response.status}`);
  }

  return (await response.json()) as TriageResponse;
}

export function ControlRoomProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("operator");
  const [frame, setFrame] = useState<MockFrame>(initialFrame);
  const [triage, setTriage] = useState<TriageResponse>(initialTriage);
  const [selectedSystemId, setSelectedSystemId] = useState(emptySystems[0]?.id ?? "");
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDegraded, setIsDegraded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>();
  const cursorRef = useRef(0);

  const requestFrame = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/alerts?cursor=${cursorRef.current}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Alert route failed with ${response.status}`);
      }

      const nextFrame = (await response.json()) as MockFrame;
      const nextTriage = await fetchTriage(nextFrame.alerts, nextFrame.systems);

      cursorRef.current = nextFrame.cursor;
      setFrame(nextFrame);
      setTriage(nextTriage);
      setLastRefresh(nextFrame.generatedAt);
      setIsDegraded(false);

      setSelectedSystemId((current) => {
        if (current && nextFrame.systems.some((system) => system.id === current)) {
          return current;
        }

        return [...nextFrame.systems].sort((a, b) => b.priority - a.priority)[0]?.id ?? current;
      });
    } catch {
      const fallbackFrame = buildMockFrame(cursorRef.current);
      const fallbackTriage = triageAlerts({
        alerts: fallbackFrame.alerts,
        systems: fallbackFrame.systems
      });

      cursorRef.current = fallbackFrame.cursor;
      setFrame(fallbackFrame);
      setTriage(fallbackTriage);
      setLastRefresh(fallbackFrame.generatedAt);
      setIsDegraded(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void requestFrame();
    const interval = window.setInterval(() => {
      void requestFrame();
    }, 3800);

    return () => window.clearInterval(interval);
  }, [requestFrame]);

  const visibleAlerts = useMemo(() => {
    return frame.alerts
      .filter((alert) => alert.roleVisibility.includes(role))
      .map((alert) => ({
        ...alert,
        acknowledged: acknowledgedAlertIds.has(alert.id)
      }));
  }, [acknowledgedAlertIds, frame.alerts, role]);

  const visibleCards = useMemo(() => {
    const visibleAlertIds = new Set(visibleAlerts.map((alert) => alert.id));
    return triage.cards
      .filter((card) => card.alertIds.some((alertId) => visibleAlertIds.has(alertId)))
      .map((card) => {
        const isAcknowledged = card.alertIds.every((alertId) => acknowledgedAlertIds.has(alertId));

        return {
          ...card,
          status: isAcknowledged ? "acknowledged" : card.status
        };
      });
  }, [acknowledgedAlertIds, triage.cards, visibleAlerts]);

  const selectedSystem = useMemo(() => {
    return frame.systems.find((system) => system.id === selectedSystemId) ?? frame.systems[0];
  }, [frame.systems, selectedSystemId]);

  const acknowledgeCard = useCallback(
    (cardId: string) => {
      const card = triage.cards.find((item) => item.id === cardId);
      if (!card) {
        return;
      }

      setAcknowledgedAlertIds((current) => {
        const next = new Set(current);
        card.alertIds.forEach((alertId) => next.add(alertId));
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
      refreshNow: requestFrame
    }),
    [
      acknowledgeCard,
      frame,
      isDegraded,
      isLoading,
      lastRefresh,
      requestFrame,
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
