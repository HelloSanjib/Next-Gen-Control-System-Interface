export type Role = "operator" | "engineer";

export type Severity = "critical" | "high" | "medium" | "low" | "normal";

export type SystemStatus = "normal" | "warning" | "critical" | "maintenance";

export type SystemKind =
  | "pump"
  | "chiller"
  | "compressor"
  | "boiler"
  | "line"
  | "power"
  | "tank"
  | "robot";

export type AlertCategory =
  | "Pump Failure"
  | "Temperature Spike"
  | "Pressure Drop"
  | "Vibration"
  | "Power Quality"
  | "Flow Imbalance"
  | "Sensor Drift"
  | "Maintenance Window";

export interface MetricSnapshot {
  temperature: number;
  pressure: number;
  vibration: number;
  flowRate: number;
  powerLoad: number;
  efficiency: number;
}

export interface TrendPoint {
  label: string;
  temperature: number;
  pressure: number;
  vibration: number;
  flowRate: number;
  efficiency: number;
}

export interface IndustrialSystem {
  id: string;
  name: string;
  area: string;
  kind: SystemKind;
  status: SystemStatus;
  priority: number;
  owner: string;
  x: number;
  y: number;
  dependencies: string[];
  etaToImpact: string;
  aiSummary: string;
  metrics: MetricSnapshot;
  trend: TrendPoint[];
}

export interface IndustrialAlert {
  id: string;
  timestamp: string;
  systemId: string;
  systemName: string;
  area: string;
  severity: Severity;
  category: AlertCategory;
  title: string;
  signal: keyof MetricSnapshot;
  value: number;
  unit: string;
  threshold: number;
  description: string;
  rootCauseHint: string;
  recommendedAction: string;
  acknowledged: boolean;
  correlationKey: string;
  roleVisibility: Role[];
}

export interface TriageCard {
  id: string;
  title: string;
  summary: string;
  severity: Severity;
  affectedSystemIds: string[];
  affectedSystemNames: string[];
  alertIds: string[];
  count: number;
  confidence: number;
  impact: string;
  primaryAction: string;
  secondaryAction: string;
  evidence: string[];
  etaToImpact: string;
  suppressedCount: number;
  status: "new" | "watching" | "acknowledged";
  createdAt: string;
}

export interface MockFrame {
  cursor: number;
  generatedAt: string;
  plantLoad: number;
  riskScore: number;
  systems: IndustrialSystem[];
  alerts: IndustrialAlert[];
}

export interface TriageResponse {
  cards: TriageCard[];
  groupedAlertCount: number;
  suppressedNormalCount: number;
  suppressionRate: number;
  narrative: string;
}
