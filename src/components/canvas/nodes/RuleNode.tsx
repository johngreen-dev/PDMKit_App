import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { cn } from "../../../lib/cn";
import { useDeviceStore } from "../../../stores/deviceStore";

export interface RuleNodeData {
  ruleType: string;
  label: string;
  category: string;
  params?: Record<string, string | number>;
}

const CATEGORY_COLORS: Record<string, string> = {
  combinational: "bg-purple-900 border-purple-600 text-purple-100",
  timing:        "bg-amber-900 border-amber-600 text-amber-100",
  oscillator:    "bg-pink-900 border-pink-600 text-pink-100",
  threshold:     "bg-orange-900 border-orange-600 text-orange-100",
  stateful:      "bg-cyan-900 border-cyan-600 text-cyan-100",
  protective:    "bg-red-900 border-red-700 text-red-100",
  can_rx:        "bg-teal-900 border-teal-600 text-teal-100",
  can_tx:        "bg-sky-900 border-sky-600 text-sky-100",
  expression:    "bg-violet-900 border-violet-600 text-violet-100",
};

const CATEGORY_LABEL: Record<string, string> = {
  combinational: "LOGIC",
  timing:        "TIMER",
  oscillator:    "OSC",
  threshold:     "THRESH",
  stateful:      "STATE",
  protective:    "PROT",
  can_rx:        "CAN RX",
  can_tx:        "CAN TX",
  expression:    "EXPR",
};

export function RuleNode({ id, data }: NodeProps) {
  const d = data as unknown as RuleNodeData;
  const colorClass = CATEGORY_COLORS[d.category] ?? "bg-zinc-800 border-zinc-600 text-zinc-100";
  const catLabel = CATEGORY_LABEL[d.category] ?? d.category;
  const { deleteElements } = useReactFlow();
  const inSetup = useDeviceStore((s) => s.inSetup);

  return (
    <div className={cn("border rounded px-3 py-2 min-w-[110px] text-center shadow relative group", colorClass)}>
      {inSetup && (
        <button
          type="button"
          title="Delete block"
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-zinc-900 border border-zinc-600 text-zinc-400 hover:bg-red-950 hover:text-red-300 hover:border-red-700 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[11px] leading-none z-10 transition-colors"
          onClick={() => deleteElements({ nodes: [{ id }] })}
        >
          ×
        </button>
      )}
      <Handle type="target" position={Position.Left} className="!bg-zinc-400 !w-2 !h-2" />
      <div className="text-[9px] opacity-60 uppercase tracking-wide mb-0.5">{catLabel}</div>
      <div className="font-mono font-bold text-xs">{d.label}</div>
      {d.params && Object.entries(d.params).length > 0 && (
        <div className="mt-1 flex flex-col gap-0.5">
          {Object.entries(d.params).map(([k, v]) => (
            <span key={k} className="text-[9px] opacity-70">
              {k}: {v}
            </span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-zinc-400 !w-2 !h-2" />
    </div>
  );
}
