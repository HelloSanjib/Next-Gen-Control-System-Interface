import type { IndustrialSystem, SystemKind } from "@/types/industrial";

export interface SystemBlueprint {
  id: string;
  name: string;
  area: string;
  kind: SystemKind;
  owner: string;
  x: number;
  y: number;
  dependencies: string[];
  base: {
    temperature: number;
    pressure: number;
    vibration: number;
    flowRate: number;
    powerLoad: number;
    efficiency: number;
  };
}

export const systemBlueprints: SystemBlueprint[] = [
  {
    id: "chiller-2",
    name: "Chiller Loop 2",
    area: "Cooling",
    kind: "chiller",
    owner: "Thermal Ops",
    x: 16,
    y: 28,
    dependencies: ["pump-7", "line-a"],
    base: {
      temperature: 44,
      pressure: 6.2,
      vibration: 1.2,
      flowRate: 78,
      powerLoad: 62,
      efficiency: 89
    }
  },
  {
    id: "pump-7",
    name: "Pump P-07",
    area: "Cooling",
    kind: "pump",
    owner: "Maintenance A",
    x: 31,
    y: 43,
    dependencies: ["chiller-2", "line-a"],
    base: {
      temperature: 52,
      pressure: 5.8,
      vibration: 2.1,
      flowRate: 72,
      powerLoad: 56,
      efficiency: 86
    }
  },
  {
    id: "line-a",
    name: "Assembly Line A",
    area: "Production",
    kind: "line",
    owner: "Line Ops",
    x: 53,
    y: 34,
    dependencies: ["pump-7", "robot-cell-4", "compressor-1"],
    base: {
      temperature: 39,
      pressure: 4.3,
      vibration: 1.4,
      flowRate: 91,
      powerLoad: 74,
      efficiency: 93
    }
  },
  {
    id: "compressor-1",
    name: "Compressor C-01",
    area: "Utilities",
    kind: "compressor",
    owner: "Utilities",
    x: 73,
    y: 23,
    dependencies: ["line-a", "tank-3"],
    base: {
      temperature: 61,
      pressure: 7.8,
      vibration: 2.4,
      flowRate: 67,
      powerLoad: 71,
      efficiency: 84
    }
  },
  {
    id: "boiler-5",
    name: "Boiler B-05",
    area: "Thermal",
    kind: "boiler",
    owner: "Thermal Ops",
    x: 78,
    y: 62,
    dependencies: ["tank-3", "grid-a"],
    base: {
      temperature: 84,
      pressure: 8.4,
      vibration: 1.8,
      flowRate: 64,
      powerLoad: 68,
      efficiency: 88
    }
  },
  {
    id: "tank-3",
    name: "Buffer Tank T-03",
    area: "Utilities",
    kind: "tank",
    owner: "Utilities",
    x: 57,
    y: 70,
    dependencies: ["compressor-1", "boiler-5"],
    base: {
      temperature: 42,
      pressure: 5.1,
      vibration: 0.7,
      flowRate: 58,
      powerLoad: 29,
      efficiency: 91
    }
  },
  {
    id: "robot-cell-4",
    name: "Robot Cell R-04",
    area: "Production",
    kind: "robot",
    owner: "Automation",
    x: 42,
    y: 64,
    dependencies: ["line-a", "grid-a"],
    base: {
      temperature: 46,
      pressure: 3.1,
      vibration: 1.6,
      flowRate: 42,
      powerLoad: 82,
      efficiency: 94
    }
  },
  {
    id: "grid-a",
    name: "Power Feeder A",
    area: "Electrical",
    kind: "power",
    owner: "Electrical",
    x: 21,
    y: 72,
    dependencies: ["robot-cell-4", "boiler-5"],
    base: {
      temperature: 38,
      pressure: 2.2,
      vibration: 0.6,
      flowRate: 34,
      powerLoad: 77,
      efficiency: 96
    }
  }
];

export const emptySystems: IndustrialSystem[] = systemBlueprints.map((system) => ({
  id: system.id,
  name: system.name,
  area: system.area,
  kind: system.kind,
  status: "normal",
  priority: 10,
  owner: system.owner,
  x: system.x,
  y: system.y,
  dependencies: system.dependencies,
  etaToImpact: "Stable",
  aiSummary: "Operating within expected envelope.",
  metrics: system.base,
  trend: []
}));
