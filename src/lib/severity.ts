import type { Severity } from "@/types/industrial";

export const severityRank: Record<Severity, number> = {
  normal: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

export const severityLabel: Record<Severity, string> = {
  normal: "Normal",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical"
};

export function highestSeverity(values: Severity[]): Severity {
  return values.reduce<Severity>((highest, current) => {
    return severityRank[current] > severityRank[highest] ? current : highest;
  }, "normal");
}

export function severityTone(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "border-alarm-critical/70 bg-alarm-critical/10 text-red-100";
    case "high":
      return "border-alarm-high/60 bg-alarm-high/10 text-orange-100";
    case "medium":
      return "border-alarm-medium/50 bg-alarm-medium/10 text-yellow-100";
    case "low":
      return "border-alarm-low/45 bg-alarm-low/10 text-sky-100";
    default:
      return "border-alarm-normal/30 bg-alarm-normal/10 text-emerald-100";
  }
}

export function severityDot(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "bg-alarm-critical shadow-[0_0_18px_rgba(255,59,79,0.8)]";
    case "high":
      return "bg-alarm-high shadow-[0_0_14px_rgba(255,138,61,0.72)]";
    case "medium":
      return "bg-alarm-medium";
    case "low":
      return "bg-alarm-low";
    default:
      return "bg-alarm-normal";
  }
}
