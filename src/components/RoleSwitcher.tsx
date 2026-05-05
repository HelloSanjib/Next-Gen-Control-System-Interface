"use client";

import { HardHat, UserCog } from "lucide-react";
import { useControlRoom } from "@/context/ControlRoomContext";
import type { Role } from "@/types/industrial";
import { cn } from "@/lib/cn";

const options: Array<{ role: Role; label: string; Icon: typeof HardHat }> = [
  { role: "operator", label: "Operator", Icon: HardHat },
  { role: "engineer", label: "Engineer", Icon: UserCog }
];

export function RoleSwitcher() {
  const { role, setRole } = useControlRoom();

  return (
    <div className="inline-grid grid-cols-2 rounded-md border border-control-line bg-control-panel p-1" aria-label="Role view">
      {options.map(({ role: optionRole, label, Icon }) => {
        const active = role === optionRole;

        return (
          <button
            key={optionRole}
            type="button"
            title={`${label} view`}
            onClick={() => setRole(optionRole)}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded-[6px] px-3 text-sm font-semibold transition",
              active
                ? "bg-process-cyan text-slate-950 shadow-[0_0_20px_rgba(49,214,255,0.22)]"
                : "text-control-muted hover:bg-control-panel2 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
