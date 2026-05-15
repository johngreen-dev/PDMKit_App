import { Cpu, Layers, Variable, GitFork, Workflow, Terminal } from "lucide-react";
import { cn } from "../../lib/cn";

export type Section = "pins" | "groups" | "variables" | "rules" | "canvas" | "monitor";

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "pins",      label: "Pins",      icon: <Cpu size={18} /> },
  { id: "groups",    label: "Groups",    icon: <Layers size={18} /> },
  { id: "variables", label: "Variables", icon: <Variable size={18} /> },
  { id: "rules",     label: "Rules",     icon: <GitFork size={18} /> },
  { id: "canvas",    label: "Canvas",    icon: <Workflow size={18} /> },
  { id: "monitor",   label: "Monitor",   icon: <Terminal size={18} /> },
];

interface Props {
  active: Section;
  onChange: (s: Section) => void;
}

export function Sidebar({ active, onChange }: Props) {
  return (
    <nav className="flex flex-col gap-1 p-2 bg-zinc-850 border-r border-zinc-700 w-16 shrink-0">
      {NAV.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          title={item.label}
          className={cn(
            "flex flex-col items-center gap-1 py-2 rounded text-xs transition-colors",
            active === item.id
              ? "bg-blue-600 text-white"
              : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100",
          )}
        >
          {item.icon}
          <span className="text-[10px]">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
