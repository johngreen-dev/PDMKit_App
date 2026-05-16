import { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { useDeviceStore } from "../../../stores/deviceStore";

export function DeletableEdge({
  id,
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  style,
  markerEnd,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const { deleteElements } = useReactFlow();
  const inSetup = useDeviceStore((s) => s.inSetup);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {/* Wider transparent hit area for reliable hover */}
      <path
        d={edgePath}
        strokeWidth={16}
        stroke="transparent"
        fill="none"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {inSetup && hovered && (
        <EdgeLabelRenderer>
          <button
            type="button"
            title="Remove connection"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan w-5 h-5 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-400 hover:bg-red-950 hover:text-red-300 hover:border-red-700 text-xs flex items-center justify-center leading-none transition-colors"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => deleteElements({ edges: [{ id }] })}
          >
            ×
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
