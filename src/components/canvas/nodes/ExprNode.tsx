import { Handle, Position, type NodeProps } from "@xyflow/react";

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

export function ExprNode({ data }: NodeProps) {
  const { op } = data as unknown as ExprNodeData;
  const inputs = inputCount[op] ?? 2;

  return (
    <div className="border-2 border-dashed border-violet-500 rounded-lg bg-violet-950 px-4 py-2 min-w-[72px] text-center shadow-lg shadow-violet-900/40 relative">
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
