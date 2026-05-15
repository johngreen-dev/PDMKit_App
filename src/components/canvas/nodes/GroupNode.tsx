import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface GroupNodeData {
  label: string;
  members: string[];
}

export function GroupNode({ data }: NodeProps) {
  const d = data as unknown as GroupNodeData;
  return (
    <div className="bg-violet-900 border border-violet-500 rounded px-3 py-2 min-w-[100px] text-center shadow">
      {/* Acts as source — any member high → drives connected rules */}
      <Handle type="source" position={Position.Right} className="!bg-violet-400 !w-2 !h-2" />
      {/* Acts as destination — connected rules drive all members */}
      <Handle type="target" position={Position.Left} className="!bg-violet-400 !w-2 !h-2" />
      <div className="text-[10px] text-violet-400 uppercase tracking-wide mb-0.5">Group</div>
      <div className="text-violet-100 font-mono font-bold text-xs">{d.label}</div>
      <div className="mt-1 flex flex-wrap justify-center gap-0.5">
        {d.members.map((m) => (
          <span key={m} className="text-[9px] text-violet-300 opacity-70">{m}</span>
        ))}
      </div>
    </div>
  );
}
