import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface OutputNodeData {
  label: string;
  pinType: "dout" | "pwm";
}

export function OutputNode({ data }: NodeProps) {
  const d = data as unknown as OutputNodeData;
  return (
    <div className="bg-blue-900 border border-blue-600 rounded px-3 py-2 min-w-[90px] text-center shadow">
      <div className="text-[10px] text-blue-400 uppercase tracking-wide mb-0.5">
        {d.pinType === "pwm" ? "PWM" : "Output"}
      </div>
      <div className="text-blue-100 font-mono font-bold text-xs">{d.label}</div>
      <Handle type="target" position={Position.Left} className="!bg-blue-400 !w-2 !h-2" />
    </div>
  );
}
