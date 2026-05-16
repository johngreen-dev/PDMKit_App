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
import { DeletableEdge } from "./edges/DeletableEdge";
import { RuleToolbox, type ToolboxItem } from "./toolbox/RuleToolbox";
import { NodePropertiesPanel } from "./NodePropertiesPanel";
import { RULE_PARAM_FIELDS } from "../../lib/nodeParams";
import type { RuleNodeData } from "./nodes/RuleNode";
import type { ExprNodeData } from "./nodes/ExprNode";
import type { Group } from "../../types/config";
import { rulesToCanvas } from "../../lib/rulesToCanvas";
import { loadPositions, persistPositions } from "../../lib/canvasPositions";

let nodeIdCounter = 1000;
const nextId = () => `n${nodeIdCounter++}`;

const edgeTypes = { deletable: DeletableEdge };

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
  const nodesRef = useRef<Node[]>([]);
  nodesRef.current = nodes;

  useEffect(() => { syncNodes(nodes); }, [nodes]);
  useEffect(() => { syncEdges(edges); }, [edges]);

  useEffect(() => {
    const saved = loadPositions();
    const applyPos = (n: Node): Node => saved[n.id] ? { ...n, position: saved[n.id] } : n;
    const { ruleNodes, edges: ruleEdges } = rulesToCanvas(rules, pins, groups);

    // When a reload produces rule nodes with empty params (e.g. RS_GetStorage unavailable
    // and RS_ListRules fallback used), keep the params already on the canvas so the user
    // doesn't lose edited values and CAN fields don't revert to defaults.
    const existingById = new Map(nodesRef.current.map((n) => [n.id, n]));
    const mergedRuleNodes = ruleNodes.map((newNode) => {
      if (newNode.type !== "rule") return newNode;
      const existing = existingById.get(newNode.id);
      if (!existing) return newNode;
      const newParams  = (newNode.data  as unknown as RuleNodeData).params ?? {};
      const oldParams  = (existing.data as unknown as RuleNodeData).params ?? {};
      if (Object.keys(newParams).length === 0 && Object.keys(oldParams).length > 0) {
        return { ...newNode, data: { ...(newNode.data as object), params: oldParams } as unknown as Record<string, unknown> };
      }
      return newNode;
    });

    setNodes([...buildStaticNodes(pins, groups).map(applyPos), ...mergedRuleNodes.map(applyPos)]);
    setEdges(ruleEdges);
  }, [pins, groups, rules]);

  const onNodeDragStop = useCallback((_: React.MouseEvent, _node: Node, draggedNodes: Node[]) => {
    persistPositions(draggedNodes.map((n) => ({ id: n.id, position: n.position })));
  }, []);

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
          type: "deletable",
          animated: true,
          style: { stroke: "#22c55e", strokeWidth: 2 },
          data: { ruleType: "direct" },
        };
        setEdges((eds) => addEdge(directEdge, eds));
      } else {
        setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
      }
    },
    [getNode],
  );

  const updateParam = useCallback(
    (nodeId: string, key: string, value: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...(n.data as object), params: { ...(n.data as unknown as RuleNodeData).params, [key]: value } } }
            : n,
        ),
      );
    },
    [],
  );

  // Add a rule or expression node at the centre of the visible canvas area
  const addRuleNode = useCallback(
    (item: ToolboxItem) => {
      const bounds = wrapperRef.current?.getBoundingClientRect();
      const cx = bounds ? bounds.left + bounds.width  / 2 : window.innerWidth  / 2;
      const cy = bounds ? bounds.top  + bounds.height / 2 : window.innerHeight / 2;

      const scatter = (nodeIdCounter % 7) * 30 - 90;
      const position = screenToFlowPosition({ x: cx + scatter, y: cy + scatter });

      const newNode: Node = item.kind === "expr"
        ? {
            id: nextId(),
            type: "expr",
            position,
            data: { op: item.ruleType as ExprNodeData["op"] } satisfies ExprNodeData as unknown as Record<string, unknown>,
          }
        : {
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

  const selectedNode = nodes.find((n) => n.selected && n.type === "rule");
  const selectedRuleData = selectedNode?.data as unknown as RuleNodeData | undefined;
  const showPropertiesPanel = selectedRuleData !== undefined && (RULE_PARAM_FIELDS[selectedRuleData.ruleType]?.length ?? 0) > 0;

  return (
    <div className="flex h-full">
      <div className="flex-1 relative" ref={wrapperRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: "deletable", animated: true }}
          fitView
          colorMode="dark"
          nodesDraggable={true}
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
                Enter Setup Mode to connect nodes and apply
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
      {showPropertiesPanel && selectedNode && selectedRuleData && (
        <NodePropertiesPanel
          nodeId={selectedNode.id}
          data={selectedRuleData}
          onParamChange={updateParam}
          readOnly={!inSetup}
        />
      )}
      {inSetup && <RuleToolbox onAdd={addRuleNode} />}
    </div>
  );
}
