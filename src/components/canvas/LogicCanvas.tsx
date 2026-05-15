import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useRef, useEffect } from "react";
import { useConfigStore } from "../../stores/configStore";
import { useDeviceStore } from "../../stores/deviceStore";
import { useCanvasStore } from "../../stores/canvasStore";
import { nodeTypes } from "./nodes/nodeTypes";
import { RuleToolbox, type ToolboxItem } from "./toolbox/RuleToolbox";
import type { RuleNodeData } from "./nodes/RuleNode";
import type { Group } from "../../types/config";
import { rulesToCanvas } from "../../lib/rulesToCanvas";

let nodeIdCounter = 1000;
const nextId = () => `n${nodeIdCounter++}`;

// A node type that carries a name the firmware understands (pin or group)
type NamedNodeType = "input_pin" | "output_pin" | "group";

function isDirectPair(srcType: string | undefined, dstType: string | undefined): boolean {
  if (!srcType || !dstType) return false;
  const sources: NamedNodeType[] = ["input_pin", "group"];
  const targets: NamedNodeType[] = ["output_pin", "group"];
  return sources.includes(srcType as NamedNodeType) && targets.includes(dstType as NamedNodeType);
}

function buildStaticNodes(
  pins: ReturnType<typeof useConfigStore.getState>["pins"],
  groups: Group[],
): Node[] {
  const inputs: Node[] = [];
  const outputs: Node[] = [];
  const groupNodes: Node[] = [];

  pins.forEach((p, i) => {
    if (p.type === "din" || p.type === "adc") {
      inputs.push({
        id: `in_${p.name}`,
        type: "input_pin",
        position: { x: 20, y: 60 + i * 80 },
        data: { label: p.name, pinType: p.type },
        deletable: false,
      });
    } else if (p.type === "dout" || p.type === "pwm") {
      outputs.push({
        id: `out_${p.name}`,
        type: "output_pin",
        position: { x: 960, y: 60 + i * 80 },
        data: { label: p.name, pinType: p.type },
        deletable: false,
      });
    }
  });

  groups.forEach((g, i) => {
    groupNodes.push({
      id: `grp_${g.name}`,
      type: "group",
      position: { x: 460, y: 60 + i * 90 },
      data: { label: g.name, members: g.members },
      deletable: false,
    });
  });

  return [...inputs, ...groupNodes, ...outputs];
}

export function LogicCanvas() {
  const { pins, groups, rules } = useConfigStore();
  const { inSetup } = useDeviceStore();
  const { setNodes: syncNodes, setEdges: syncEdges } = useCanvasStore();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getNode } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(buildStaticNodes(pins, groups));
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Keep canvas store in sync so ConnectionBar can read it for rule generation
  useEffect(() => { syncNodes(nodes); }, [nodes]);
  useEffect(() => { syncEdges(edges); }, [edges]);

  // Rebuild the full canvas whenever config changes.
  // Rules from the device are converted back to nodes+edges; previously
  // user-dropped rule nodes that aren't in the device config are discarded.
  useEffect(() => {
    const { ruleNodes, edges: ruleEdges } = rulesToCanvas(rules, pins, groups);
    setNodes([...buildStaticNodes(pins, groups), ...ruleNodes]);
    setEdges(ruleEdges);
  }, [pins, groups, rules]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = getNode(connection.source ?? "");
      const targetNode = getNode(connection.target ?? "");

      if (isDirectPair(sourceNode?.type, targetNode?.type)) {
        const directEdge: Edge = {
          id: `e-${connection.source}-${connection.target}`,
          source: connection.source ?? "",
          target: connection.target ?? "",
          sourceHandle: connection.sourceHandle ?? null,
          targetHandle: connection.targetHandle ?? null,
          label: "direct",
          animated: true,
          style: { stroke: "#22c55e", strokeWidth: 2 },
          labelStyle: { fill: "#22c55e", fontSize: 10 },
          labelBgStyle: { fill: "#18181b" },
          data: { ruleType: "direct" },
        };
        setEdges((eds) => addEdge(directEdge, eds));
      } else {
        setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
      }
    },
    [getNode],
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const raw = e.dataTransfer.getData("application/pdmkit-rule");
      if (!raw) return;

      const item: ToolboxItem = JSON.parse(raw) as ToolboxItem;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      const newNode: Node = {
        id: nextId(),
        type: "rule",
        position,
        data: {
          ruleType: item.ruleType,
          label: item.label,
          category: item.category,
          params: {},
        } satisfies RuleNodeData,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition],
  );

  return (
    <div className="flex h-full">
      <div
        className="flex-1 relative"
        ref={wrapperRef}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
          nodesDraggable={inSetup}
          nodesConnectable={inSetup}
          elementsSelectable={true}
          deleteKeyCode={inSetup ? "Backspace" : null}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#3f3f46" />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === "input_pin") return "#16a34a";
              if (n.type === "output_pin") return "#2563eb";
              if (n.type === "group") return "#7c3aed";
              return "#52525b";
            }}
            style={{ background: "#18181b" }}
          />
          {!inSetup && (
            <Panel position="top-center">
              <div className="px-3 py-1 bg-zinc-800 border border-zinc-600 rounded text-xs text-zinc-400">
                Enter Setup Mode to edit and apply
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
      <RuleToolbox />
    </div>
  );
}
