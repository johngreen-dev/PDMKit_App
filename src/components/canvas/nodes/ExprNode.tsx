import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { useDeviceStore } from "../../../stores/deviceStore";

export type ExprOp = "AND" | "OR" | "NOT" | "XOR";

export interface ExprNodeData {
  op: ExprOp;
}

const inputCount: Record<ExprOp, number> = {
  AND: 2,
  OR: 2,
  NOT: 1,
  XOR: 2,
};

export function ExprNode({ id, data }: NodeProps) {
  const { op } = data as unknown as ExprNodeData;
  const inputs = inputCount[op] ?? 2;
  const { deleteElements } = useReactFlow();
  const inSetup = useDeviceStore((s) => s.inSetup);

  return (
    <div className="border-2 border-dashed border-violet-500 rounded-lg bg-violet-950 px-4 py-2 min-w-[72px] text-center shadow-lg shadow-violet-900/40 relative group">
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
      {Array.from({ length: inputs }, (_, i) => (
        <Handle
          key={i}
          type="target"
          position={Position.Left}
          id={`t${i}`}
          style={{ top: inputs === 1 ? "50%" : `${33 + i * 34}%` }}
          className="!bg-violet-400 !w-2.5 !h-2.5"
        />
      ))}
      <div className="text-[8px] uppercase tracking-widest text-violet-500 mb-0.5 font-semibold">
        expr
      </div>
      <div className="font-mono font-bold text-sm text-violet-100">{op}</div>
      <Handle
        type="source"
        position={Position.Right}
        id="s"
        className="!bg-violet-400 !w-2.5 !h-2.5"
      />
    </div>
  );
}
