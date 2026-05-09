import type { IndustrialSystem } from "@/types/industrial";

export interface AnomalyPrediction {
  isAtRisk: boolean;
  severity: "critical" | "warning" | null;
  predictedMinutes: number | null;
  leadingMetric: string | null;
  confidence: number;
}

function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 3) return 0;
  const sumX = (n * (n - 1)) / 2;
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const sumY = values.reduce((a, v) => a + v, 0);
  const sumXY = values.reduce((a, v, i) => a + i * v, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 1e-9) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

interface MetricCheck {
  label: string;
  current: number;
  slope: number;
  warnThreshold: number;
  critThreshold: number;
}

const TICK_SECONDS = 3.8;

export function detectAnomaly(system: IndustrialSystem): AnomalyPrediction {
  const none: AnomalyPrediction = {
    isAtRisk: false,
    severity: null,
    predictedMinutes: null,
    leadingMetric: null,
    confidence: 0
  };

  if (system.status === "critical" || system.trend.length < 5) return none;

  const checks: MetricCheck[] = [
    {
      label: "temperature",
      current: system.metrics.temperature,
      slope: linearSlope(system.trend.map((p) => p.temperature)),
      warnThreshold: 72,
      critThreshold: 92
    },
    {
      label: "vibration",
      current: system.metrics.vibration,
      slope: linearSlope(system.trend.map((p) => p.vibration)),
      warnThreshold: 3.75,
      critThreshold: 5.7
    }
  ];

  let best: AnomalyPrediction = none;

  for (const c of checks) {
    if (c.slope <= 0.03) continue;

    const ticksToCrit = (c.critThreshold - c.current) / c.slope;
    const ticksToWarn = (c.warnThreshold - c.current) / c.slope;

    if (ticksToCrit > 0 && ticksToCrit < 25) {
      const minutes = parseFloat(((ticksToCrit * TICK_SECONDS) / 60).toFixed(1));
      const confidence = Math.min(96, Math.round(72 + Math.min(c.slope * 10, 14) + (25 - ticksToCrit)));
      if (!best.isAtRisk || (best.predictedMinutes ?? 999) > minutes) {
        best = { isAtRisk: true, severity: "critical", predictedMinutes: minutes, leadingMetric: c.label, confidence };
      }
    } else if (ticksToWarn > 0 && ticksToWarn < 15 && system.status === "normal") {
      const minutes = parseFloat(((ticksToWarn * TICK_SECONDS) / 60).toFixed(1));
      const confidence = Math.min(88, Math.round(62 + Math.min(c.slope * 8, 12)));
      if (!best.isAtRisk) {
        best = { isAtRisk: true, severity: "warning", predictedMinutes: minutes, leadingMetric: c.label, confidence };
      }
    }
  }

  return best;
}
