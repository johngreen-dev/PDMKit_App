import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface InputNodeData {
  label: string;
  pinType: "din" | "adc";
}

export function InputNode({ data }: NodeProps) {
  const d = data as unknown as InputNodeData;
  return (
    <div className="bg-green-900 border border-green-600 rounded px-3 py-2 min-w-[90px] text-center shadow">
      <div className="text-[10px] text-green-400 uppercase tracking-wide mb-0.5">
        {d.pinType === "adc" ? "ADC" : "Input"}
      </div>
      <div className="text-green-100 font-mono font-bold text-xs">{d.label}</div>
      <Handle type="source" position={Position.Right} className="!bg-green-400 !w-2 !h-2" />
    </div>
  );
}
