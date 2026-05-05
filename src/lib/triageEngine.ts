import type { IndustrialAlert, IndustrialSystem, Severity, TriageCard, TriageResponse } from "@/types/industrial";
import { highestSeverity, severityRank } from "@/lib/severity";

interface TriageInput {
  alerts: IndustrialAlert[];
  systems: IndustrialSystem[];
}

const contextDictionary: Record<
  string,
  {
    title: string;
    impact: string;
    primaryAction: string;
    secondaryAction: string;
    eta: string;
  }
> = {
  "cooling-loop-instability": {
    title: "Cooling loop instability",
    impact: "Assembly Line A may derate if coolant flow does not recover.",
    primaryAction: "Stage standby pump and reduce Line A speed",
    secondaryAction: "Inspect suction strainer and condenser fan response",
    eta: "7-12 min"
  },
  "compressed-air-sag": {
    title: "Compressed air pressure sag",
    impact: "Pneumatic stations may miss cycle timing under peak demand.",
    primaryAction: "Open standby compressor permissive",
    secondaryAction: "Hold non-critical pneumatic consumers",
    eta: "18-24 min"
  },
  "thermal-pressure-excursion": {
    title: "Thermal pressure excursion",
    impact: "Boiler pressure could force conservative thermal mode.",
    primaryAction: "Place burner trim in conservative mode",
    secondaryAction: "Verify feedwater valve response",
    eta: "8-15 min"
  },
  "power-quality-harmonics": {
    title: "Power quality disturbance",
    impact: "Servo drives and burner controls have reduced operating margin.",
    primaryAction: "Transfer discretionary load to Feeder B",
    secondaryAction: "Monitor THD and cabinet temperature",
    eta: "12-20 min"
  },
  "robot-cell-drift": {
    title: "Robot cell drift",
    impact: "Small handoff delays may reduce line efficiency over the next cycle block.",
    primaryAction: "Schedule calibration at next micro-stop",
    secondaryAction: "Review last 30 robot handoff cycles",
    eta: "45-60 min"
  },
  "instrumentation-drift": {
    title: "Instrumentation drift",
    impact: "Telemetry trust is reduced for one low-risk measurement channel.",
    primaryAction: "Compare redundant channel readings",
    secondaryAction: "Create calibration note for maintenance round",
    eta: "Stable"
  }
};

function fallbackContext(key: string) {
  return {
    title: key
      .split("-")
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" "),
    impact: "Related events are trending together and should be reviewed as a shared condition.",
    primaryAction: "Review correlated alarms",
    secondaryAction: "Validate sensor readings against local panels",
    eta: "Under review"
  };
}

function summaryFor(alerts: IndustrialAlert[], affectedSystems: string[], severity: Severity) {
  const categories = Array.from(new Set(alerts.map((alert) => alert.category.toLowerCase())));
  const systemText = affectedSystems.length === 1 ? affectedSystems[0] : `${affectedSystems.length} systems`;
  const severityText = severity === "critical" ? "critical intervention" : severity === "high" ? "operator action" : "watchlist action";

  return `${alerts.length} related ${alerts.length === 1 ? "alert" : "alerts"} across ${systemText}: ${categories.join(", ")}. Recommended as one ${severityText}.`;
}

function buildEvidence(alerts: IndustrialAlert[]) {
  return alerts.slice(0, 4).map((alert) => {
    return `${alert.systemName}: ${alert.signal} ${alert.value}${alert.unit} vs ${alert.threshold}${alert.unit}`;
  });
}

export function triageAlerts({ alerts, systems }: TriageInput): TriageResponse {
  const normalSystems = systems.filter((system) => system.status === "normal").length;

  if (alerts.length === 0) {
    return {
      cards: [],
      groupedAlertCount: 0,
      suppressedNormalCount: normalSystems,
      suppressionRate: 100,
      narrative: "All monitored systems are inside their learned operating envelopes."
    };
  }

  const grouped = new Map<string, IndustrialAlert[]>();
  for (const alert of alerts) {
    const key = alert.correlationKey || `${alert.systemId}-${alert.category}`;
    const existing = grouped.get(key) ?? [];
    existing.push(alert);
    grouped.set(key, existing);
  }

  const cards: TriageCard[] = Array.from(grouped.entries()).map(([key, relatedAlerts]) => {
    const affectedSystemIds = Array.from(new Set(relatedAlerts.map((alert) => alert.systemId)));
    const affectedSystemNames = Array.from(new Set(relatedAlerts.map((alert) => alert.systemName)));
    const severity = highestSeverity(relatedAlerts.map((alert) => alert.severity));
    const context = contextDictionary[key] ?? fallbackContext(key);
    const systemPriorityBoost = systems
      .filter((system) => affectedSystemIds.includes(system.id))
      .reduce((sum, system) => sum + system.priority, 0);
    const confidence = Math.min(
      98,
      Math.round(68 + relatedAlerts.length * 7 + affectedSystemIds.length * 4 + severityRank[severity] * 3 + systemPriorityBoost / 38)
    );

    return {
      id: `triage-${key}`,
      title: context.title,
      summary: summaryFor(relatedAlerts, affectedSystemNames, severity),
      severity,
      affectedSystemIds,
      affectedSystemNames,
      alertIds: relatedAlerts.map((alert) => alert.id),
      count: relatedAlerts.length,
      confidence,
      impact: context.impact,
      primaryAction: context.primaryAction,
      secondaryAction: context.secondaryAction,
      evidence: buildEvidence(relatedAlerts),
      etaToImpact: context.eta,
      suppressedCount: Math.max(0, normalSystems - affectedSystemIds.length),
      status: severityRank[severity] >= 3 ? "new" : "watching",
      createdAt: relatedAlerts
        .map((alert) => alert.timestamp)
        .sort()
        .at(0) ?? new Date().toISOString()
    };
  });

  cards.sort((a, b) => {
    const severityDelta = severityRank[b.severity] - severityRank[a.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }

    return b.count - a.count;
  });

  const groupedAlertCount = cards.reduce((sum, card) => sum + card.count, 0);
  const suppressionRate = Math.round(((alerts.length - cards.length + normalSystems) / (alerts.length + systems.length)) * 100);
  const highestCard = cards[0];
  const narrative = highestCard
    ? `${alerts.length} raw alerts compressed into ${cards.length} action cards. Highest priority: ${highestCard.title}.`
    : "No actionable groups found.";

  return {
    cards,
    groupedAlertCount,
    suppressedNormalCount: normalSystems,
    suppressionRate,
    narrative
  };
}
