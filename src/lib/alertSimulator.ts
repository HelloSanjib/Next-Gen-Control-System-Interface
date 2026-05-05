import { systemBlueprints } from "@/data/industrialModel";
import type {
  AlertCategory,
  IndustrialAlert,
  IndustrialSystem,
  MetricSnapshot,
  MockFrame,
  Severity,
  SystemStatus,
  TrendPoint
} from "@/types/industrial";
import { clamp } from "@/lib/format";
import { severityRank } from "@/lib/severity";

type ScenarioKey =
  | "cooling-loop-instability"
  | "compressed-air-sag"
  | "thermal-pressure-excursion"
  | "power-quality-harmonics"
  | "robot-cell-drift";

interface ScenarioState {
  key: ScenarioKey;
  active: boolean;
  intensity: number;
}

const metricUnits: Record<keyof MetricSnapshot, string> = {
  temperature: "C",
  pressure: "bar",
  vibration: "mm/s",
  flowRate: "%",
  powerLoad: "%",
  efficiency: "%"
};

const severityPriority: Record<SystemStatus, number> = {
  normal: 12,
  maintenance: 26,
  warning: 58,
  critical: 92
};

function wave(tick: number, offset: number, scale = 1) {
  return Math.sin(tick * 0.54 + offset) * scale + Math.cos(tick * 0.17 + offset * 0.7) * scale * 0.4;
}

function scenarioStates(tick: number): ScenarioState[] {
  const coolingPhase = tick % 18;
  const airPhase = (tick + 5) % 21;
  const thermalPhase = (tick + 10) % 26;
  const powerPhase = (tick + 3) % 23;
  const robotPhase = (tick + 8) % 16;

  return [
    {
      key: "cooling-loop-instability",
      active: coolingPhase >= 4 && coolingPhase <= 10,
      intensity: coolingPhase >= 6 && coolingPhase <= 8 ? 1 : 0.62
    },
    {
      key: "compressed-air-sag",
      active: airPhase >= 10 && airPhase <= 15,
      intensity: airPhase === 12 || airPhase === 13 ? 0.86 : 0.52
    },
    {
      key: "thermal-pressure-excursion",
      active: thermalPhase >= 15 && thermalPhase <= 20,
      intensity: thermalPhase >= 17 && thermalPhase <= 18 ? 0.92 : 0.56
    },
    {
      key: "power-quality-harmonics",
      active: powerPhase >= 11 && powerPhase <= 14,
      intensity: powerPhase === 12 ? 0.78 : 0.48
    },
    {
      key: "robot-cell-drift",
      active: robotPhase >= 5 && robotPhase <= 8,
      intensity: robotPhase === 7 ? 0.72 : 0.43
    }
  ];
}

function getScenario(key: ScenarioKey, scenarios: ScenarioState[]) {
  return scenarios.find((scenario) => scenario.key === key) ?? { key, active: false, intensity: 0 };
}

function getMetricAdjustments(systemId: string, scenarios: ScenarioState[]) {
  const adjustments: Partial<Record<keyof MetricSnapshot, number>> = {};
  const apply = (metric: keyof MetricSnapshot, value: number) => {
    adjustments[metric] = (adjustments[metric] ?? 0) + value;
  };

  const cooling = getScenario("cooling-loop-instability", scenarios);
  if (cooling.active && ["chiller-2", "pump-7", "line-a"].includes(systemId)) {
    apply("temperature", 12 * cooling.intensity);
    apply("pressure", systemId === "pump-7" ? -1.65 * cooling.intensity : -0.85 * cooling.intensity);
    apply("flowRate", systemId === "line-a" ? -14 * cooling.intensity : -20 * cooling.intensity);
    apply("vibration", systemId === "pump-7" ? 3.25 * cooling.intensity : 0.7 * cooling.intensity);
    apply("efficiency", -11 * cooling.intensity);
    apply("powerLoad", 8 * cooling.intensity);
  }

  const air = getScenario("compressed-air-sag", scenarios);
  if (air.active && ["compressor-1", "line-a", "tank-3"].includes(systemId)) {
    apply("pressure", -2.05 * air.intensity);
    apply("flowRate", -12 * air.intensity);
    apply("vibration", systemId === "compressor-1" ? 2.1 * air.intensity : 0.4 * air.intensity);
    apply("efficiency", -8 * air.intensity);
    apply("powerLoad", systemId === "compressor-1" ? 10 * air.intensity : 2 * air.intensity);
  }

  const thermal = getScenario("thermal-pressure-excursion", scenarios);
  if (thermal.active && ["boiler-5", "tank-3"].includes(systemId)) {
    apply("temperature", 17 * thermal.intensity);
    apply("pressure", 1.55 * thermal.intensity);
    apply("flowRate", -7 * thermal.intensity);
    apply("efficiency", -7 * thermal.intensity);
  }

  const power = getScenario("power-quality-harmonics", scenarios);
  if (power.active && ["grid-a", "robot-cell-4", "boiler-5"].includes(systemId)) {
    apply("powerLoad", 16 * power.intensity);
    apply("temperature", 5 * power.intensity);
    apply("efficiency", -6 * power.intensity);
    apply("vibration", systemId === "robot-cell-4" ? 1.15 * power.intensity : 0.25 * power.intensity);
  }

  const robot = getScenario("robot-cell-drift", scenarios);
  if (robot.active && ["robot-cell-4", "line-a"].includes(systemId)) {
    apply("vibration", 2.45 * robot.intensity);
    apply("powerLoad", 7 * robot.intensity);
    apply("flowRate", systemId === "line-a" ? -8 * robot.intensity : -2 * robot.intensity);
    apply("efficiency", -7 * robot.intensity);
  }

  return adjustments;
}

function buildMetrics(systemIndex: number, tick: number, adjustments: Partial<Record<keyof MetricSnapshot, number>>): MetricSnapshot {
  const base = systemBlueprints[systemIndex].base;
  const natural = {
    temperature: wave(tick, systemIndex, 2.2),
    pressure: wave(tick, systemIndex + 2, 0.25),
    vibration: Math.max(0, wave(tick, systemIndex + 4, 0.35)),
    flowRate: wave(tick, systemIndex + 6, 2.6),
    powerLoad: wave(tick, systemIndex + 8, 2.1),
    efficiency: wave(tick, systemIndex + 10, 1.4)
  };

  return {
    temperature: Number(clamp(base.temperature + natural.temperature + (adjustments.temperature ?? 0), 22, 112).toFixed(1)),
    pressure: Number(clamp(base.pressure + natural.pressure + (adjustments.pressure ?? 0), 1.2, 10.5).toFixed(2)),
    vibration: Number(clamp(base.vibration + natural.vibration + (adjustments.vibration ?? 0), 0.1, 8.8).toFixed(2)),
    flowRate: Number(clamp(base.flowRate + natural.flowRate + (adjustments.flowRate ?? 0), 18, 100).toFixed(0)),
    powerLoad: Number(clamp(base.powerLoad + natural.powerLoad + (adjustments.powerLoad ?? 0), 12, 100).toFixed(0)),
    efficiency: Number(clamp(base.efficiency + natural.efficiency + (adjustments.efficiency ?? 0), 42, 99).toFixed(0))
  };
}

function buildTrend(systemIndex: number, tick: number, adjustments: Partial<Record<keyof MetricSnapshot, number>>): TrendPoint[] {
  return Array.from({ length: 20 }, (_, index) => {
    const pointTick = tick - 19 + index;
    const ratio = index / 19;
    const attenuated = Object.fromEntries(
      Object.entries(adjustments).map(([key, value]) => [key, (value ?? 0) * ratio])
    ) as Partial<Record<keyof MetricSnapshot, number>>;
    const metrics = buildMetrics(systemIndex, pointTick, attenuated);

    return {
      label: `${index + 1}`,
      temperature: metrics.temperature,
      pressure: metrics.pressure,
      vibration: metrics.vibration,
      flowRate: metrics.flowRate,
      efficiency: metrics.efficiency
    };
  });
}

function classifySystem(metrics: MetricSnapshot, systemId: string): SystemStatus {
  if (
    metrics.temperature >= 92 ||
    metrics.pressure <= 3.25 ||
    metrics.pressure >= 9.55 ||
    metrics.vibration >= 5.7 ||
    metrics.flowRate <= 48 ||
    metrics.efficiency <= 68
  ) {
    return "critical";
  }

  if (
    metrics.temperature >= 72 ||
    metrics.pressure <= 4.2 ||
    metrics.pressure >= 8.85 ||
    metrics.vibration >= 3.75 ||
    metrics.flowRate <= 62 ||
    metrics.efficiency <= 78 ||
    (systemId === "grid-a" && metrics.powerLoad >= 91)
  ) {
    return "warning";
  }

  return "normal";
}

function etaForStatus(status: SystemStatus, priority: number) {
  if (status === "critical") {
    return priority > 95 ? "7 min" : "12 min";
  }

  if (status === "warning") {
    return priority > 68 ? "22 min" : "45 min";
  }

  return "Stable";
}

function summaryFor(systemName: string, status: SystemStatus, topMetric: string) {
  if (status === "critical") {
    return `${systemName} is outside its control envelope; ${topMetric} is driving production risk.`;
  }

  if (status === "warning") {
    return `${systemName} is trending away from baseline with ${topMetric} as the leading indicator.`;
  }

  return `${systemName} is operating inside expected limits.`;
}

function alertFromMetric(args: {
  id: string;
  now: number;
  system: IndustrialSystem;
  severity: Severity;
  category: AlertCategory;
  title: string;
  signal: keyof MetricSnapshot;
  threshold: number;
  description: string;
  rootCauseHint: string;
  recommendedAction: string;
  correlationKey: string;
  minutesAgo?: number;
}): IndustrialAlert {
  return {
    id: args.id,
    timestamp: new Date(args.now - (args.minutesAgo ?? 0) * 60_000).toISOString(),
    systemId: args.system.id,
    systemName: args.system.name,
    area: args.system.area,
    severity: args.severity,
    category: args.category,
    title: args.title,
    signal: args.signal,
    value: args.system.metrics[args.signal],
    unit: metricUnits[args.signal],
    threshold: args.threshold,
    description: args.description,
    rootCauseHint: args.rootCauseHint,
    recommendedAction: args.recommendedAction,
    acknowledged: false,
    correlationKey: args.correlationKey,
    roleVisibility: args.severity === "low" ? ["engineer"] : ["operator", "engineer"]
  };
}

function createAlerts(systems: IndustrialSystem[], tick: number, scenarios: ScenarioState[], now: number): IndustrialAlert[] {
  const byId = new Map(systems.map((system) => [system.id, system]));
  const alerts: IndustrialAlert[] = [];
  const push = (alert: IndustrialAlert | undefined) => {
    if (alert) {
      alerts.push(alert);
    }
  };

  const cooling = getScenario("cooling-loop-instability", scenarios);
  if (cooling.active) {
    const pump = byId.get("pump-7");
    const chiller = byId.get("chiller-2");
    const line = byId.get("line-a");
    push(
      pump &&
        alertFromMetric({
          id: `a-${tick}-pump-vib`,
          now,
          system: pump,
          severity: cooling.intensity > 0.9 ? "critical" : "high",
          category: "Vibration",
          title: "Pump P-07 vibration exceeded trip band",
          signal: "vibration",
          threshold: 4.5,
          description: "Bearing vibration is rising while coolant flow is falling.",
          rootCauseHint: "Likely cavitation from partial suction blockage or air ingress.",
          recommendedAction: "Dispatch mechanic to inspect suction strainer and stage standby pump P-08.",
          correlationKey: "cooling-loop-instability",
          minutesAgo: 1
        })
    );
    push(
      chiller &&
        alertFromMetric({
          id: `a-${tick}-chiller-temp`,
          now,
          system: chiller,
          severity: cooling.intensity > 0.9 ? "critical" : "high",
          category: "Temperature Spike",
          title: "Chiller loop temperature climbing",
          signal: "temperature",
          threshold: 54,
          description: "Supply temperature is above cooling setpoint and still increasing.",
          rootCauseHint: "Cooling loop instability is reducing heat transfer.",
          recommendedAction: "Increase condenser fan speed and verify pump P-07 flow path.",
          correlationKey: "cooling-loop-instability",
          minutesAgo: 2
        })
    );
    push(
      line &&
        alertFromMetric({
          id: `a-${tick}-line-flow`,
          now,
          system: line,
          severity: cooling.intensity > 0.9 ? "high" : "medium",
          category: "Flow Imbalance",
          title: "Line A cooling flow below operating band",
          signal: "flowRate",
          threshold: 72,
          description: "Thermal demand is outpacing cooling delivery for Assembly Line A.",
          rootCauseHint: "Dependent cooling loop is restricting flow to the line jacket.",
          recommendedAction: "Reduce Line A speed by 8 percent until loop pressure recovers.",
          correlationKey: "cooling-loop-instability",
          minutesAgo: 3
        })
    );
  }

  const air = getScenario("compressed-air-sag", scenarios);
  if (air.active) {
    const compressor = byId.get("compressor-1");
    const tank = byId.get("tank-3");
    const line = byId.get("line-a");
    push(
      compressor &&
        alertFromMetric({
          id: `a-${tick}-compressor-pressure`,
          now,
          system: compressor,
          severity: air.intensity > 0.8 ? "high" : "medium",
          category: "Pressure Drop",
          title: "Compressed air header pressure sag",
          signal: "pressure",
          threshold: 6.1,
          description: "Compressor outlet pressure dropped below the production floor target.",
          rootCauseHint: "Potential valve leakage or compressor inlet fouling.",
          recommendedAction: "Open standby compressor permissive and inspect filter DP.",
          correlationKey: "compressed-air-sag",
          minutesAgo: 1
        })
    );
    push(
      tank &&
        alertFromMetric({
          id: `a-${tick}-tank-flow`,
          now,
          system: tank,
          severity: "medium",
          category: "Flow Imbalance",
          title: "Buffer tank drawdown rate elevated",
          signal: "flowRate",
          threshold: 52,
          description: "Tank reserve is being consumed faster than replenishment rate.",
          rootCauseHint: "Compressed air sag is pushing downstream demand onto buffer storage.",
          recommendedAction: "Hold non-critical pneumatic consumers for one cycle.",
          correlationKey: "compressed-air-sag",
          minutesAgo: 2
        })
    );
    if (line && air.intensity > 0.75) {
      push(
        alertFromMetric({
          id: `a-${tick}-line-pressure`,
          now,
          system: line,
          severity: "medium",
          category: "Pressure Drop",
          title: "Line A pneumatic actuator pressure low",
          signal: "pressure",
          threshold: 3.9,
          description: "Actuator pressure margin is narrowing during indexing.",
          rootCauseHint: "Shared compressed air header is below stable operating pressure.",
          recommendedAction: "Delay next high-force station cycle until header pressure recovers.",
          correlationKey: "compressed-air-sag",
          minutesAgo: 3
        })
      );
    }
  }

  const thermal = getScenario("thermal-pressure-excursion", scenarios);
  if (thermal.active) {
    const boiler = byId.get("boiler-5");
    const tank = byId.get("tank-3");
    push(
      boiler &&
        alertFromMetric({
          id: `a-${tick}-boiler-pressure`,
          now,
          system: boiler,
          severity: thermal.intensity > 0.85 ? "critical" : "high",
          category: "Pressure Drop",
          title: "Boiler pressure excursion",
          signal: "pressure",
          threshold: 9.2,
          description: "Boiler pressure has moved above the safe optimization band.",
          rootCauseHint: "Feedwater control is lagging thermal demand changes.",
          recommendedAction: "Place burner trim in conservative mode and verify feedwater valve response.",
          correlationKey: "thermal-pressure-excursion",
          minutesAgo: 1
        })
    );
    push(
      tank &&
        alertFromMetric({
          id: `a-${tick}-tank-temp`,
          now,
          system: tank,
          severity: "medium",
          category: "Temperature Spike",
          title: "Buffer tank temperature rising",
          signal: "temperature",
          threshold: 50,
          description: "Thermal buffer temperature is drifting above transfer target.",
          rootCauseHint: "Boiler pressure excursion is pushing warmer return flow into buffer.",
          recommendedAction: "Increase recirculation for two minutes and watch return temperature.",
          correlationKey: "thermal-pressure-excursion",
          minutesAgo: 2
        })
    );
  }

  const power = getScenario("power-quality-harmonics", scenarios);
  if (power.active) {
    const grid = byId.get("grid-a");
    const robot = byId.get("robot-cell-4");
    push(
      grid &&
        alertFromMetric({
          id: `a-${tick}-grid-power`,
          now,
          system: grid,
          severity: power.intensity > 0.7 ? "high" : "medium",
          category: "Power Quality",
          title: "Power feeder harmonic distortion elevated",
          signal: "powerLoad",
          threshold: 88,
          description: "Feeder load and harmonic estimate are trending together.",
          rootCauseHint: "Large variable-frequency loads are stacking on Feeder A.",
          recommendedAction: "Transfer non-critical load bank to Feeder B and monitor THD.",
          correlationKey: "power-quality-harmonics",
          minutesAgo: 1
        })
    );
    push(
      robot &&
        alertFromMetric({
          id: `a-${tick}-robot-power`,
          now,
          system: robot,
          severity: "medium",
          category: "Power Quality",
          title: "Robot cell servo load variance",
          signal: "powerLoad",
          threshold: 89,
          description: "Servo power draw is fluctuating during repeatable motion segments.",
          rootCauseHint: "Power quality variation is reducing servo drive margin.",
          recommendedAction: "Hold calibration run until feeder harmonics normalize.",
          correlationKey: "power-quality-harmonics",
          minutesAgo: 2
        })
    );
  }

  const robot = getScenario("robot-cell-drift", scenarios);
  if (robot.active) {
    const robotCell = byId.get("robot-cell-4");
    const line = byId.get("line-a");
    push(
      robotCell &&
        alertFromMetric({
          id: `a-${tick}-robot-vibration`,
          now,
          system: robotCell,
          severity: robot.intensity > 0.65 ? "medium" : "low",
          category: "Vibration",
          title: "Robot Cell R-04 axis vibration drift",
          signal: "vibration",
          threshold: 3.4,
          description: "Axis 3 vibration signature is above learned baseline.",
          rootCauseHint: "End effector calibration or reducer backlash may be drifting.",
          recommendedAction: "Schedule calibration check at next micro-stop.",
          correlationKey: "robot-cell-drift",
          minutesAgo: 1
        })
    );
    if (line && robot.intensity > 0.6) {
      push(
        alertFromMetric({
          id: `a-${tick}-line-efficiency`,
          now,
          system: line,
          severity: "low",
          category: "Sensor Drift",
          title: "Line A cycle time variance above baseline",
          signal: "efficiency",
          threshold: 87,
          description: "Line cycle time variance is rising near Robot Cell R-04 handoff.",
          rootCauseHint: "Robot drift is creating small transfer delays.",
          recommendedAction: "Review last 30 cycles for path deviation before shift end.",
          correlationKey: "robot-cell-drift",
          minutesAgo: 3
        })
      );
    }
  }

  if (tick % 9 === 0) {
    const grid = byId.get("grid-a");
    push(
      grid &&
        alertFromMetric({
          id: `a-${tick}-grid-sensor`,
          now,
          system: grid,
          severity: "low",
          category: "Sensor Drift",
          title: "Feeder A cabinet temperature sensor drift",
          signal: "temperature",
          threshold: 42,
          description: "Redundant cabinet temperature sensors differ by more than learned tolerance.",
          rootCauseHint: "Sensor channel A may need recalibration.",
          recommendedAction: "Compare channel A against handheld reading during next round.",
          correlationKey: "instrumentation-drift",
          minutesAgo: 4
        })
    );
  }

  return alerts.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
}

export function buildMockFrame(cursor = 0, now = Date.now()): MockFrame {
  const tick = cursor + 1;
  const scenarios = scenarioStates(tick);

  const systems = systemBlueprints.map<IndustrialSystem>((blueprint, index) => {
    const adjustments = getMetricAdjustments(blueprint.id, scenarios);
    const metrics = buildMetrics(index, tick, adjustments);
    const status = classifySystem(metrics, blueprint.id);
    const pressureRisk = metrics.pressure < 4 || metrics.pressure > 8.9 ? 15 : 0;
    const vibrationRisk = metrics.vibration > 4.6 ? 18 : metrics.vibration > 3.4 ? 8 : 0;
    const temperatureRisk = metrics.temperature > 80 ? 16 : metrics.temperature > 66 ? 8 : 0;
    const efficiencyRisk = metrics.efficiency < 74 ? 15 : metrics.efficiency < 82 ? 7 : 0;
    const priority = clamp(
      severityPriority[status] + pressureRisk + vibrationRisk + temperatureRisk + efficiencyRisk + index,
      8,
      100
    );
    const topMetric =
      vibrationRisk >= temperatureRisk && vibrationRisk >= pressureRisk
        ? "vibration"
        : temperatureRisk >= pressureRisk
          ? "temperature"
          : "pressure";

    return {
      id: blueprint.id,
      name: blueprint.name,
      area: blueprint.area,
      kind: blueprint.kind,
      status,
      priority,
      owner: blueprint.owner,
      x: blueprint.x,
      y: blueprint.y,
      dependencies: blueprint.dependencies,
      etaToImpact: etaForStatus(status, priority),
      aiSummary: summaryFor(blueprint.name, status, topMetric),
      metrics,
      trend: buildTrend(index, tick, adjustments)
    };
  });

  const alerts = createAlerts(systems, tick, scenarios, now);
  const averageLoad = systems.reduce((sum, system) => sum + system.metrics.powerLoad, 0) / systems.length;
  const riskScore = clamp(
    systems.reduce((sum, system) => sum + system.priority, 0) / systems.length +
      alerts.reduce((sum, alert) => sum + severityRank[alert.severity] * 4, 0),
    0,
    100
  );

  return {
    cursor: tick,
    generatedAt: new Date(now).toISOString(),
    plantLoad: Math.round(averageLoad),
    riskScore: Math.round(riskScore),
    systems,
    alerts
  };
}
