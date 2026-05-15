import type { Node, Edge } from "@xyflow/react";
import type { Pin, Group, Rule } from "../types/config";
import type { RuleNodeData } from "../components/canvas/nodes/RuleNode";

const RULE_CATEGORIES: Record<string, string> = {
  direct: "combinational", and: "combinational", or: "combinational",
  not: "combinational", xor: "combinational", nand_nor: "combinational",
  on_delay: "timing", off_delay: "timing", min_on: "timing",
  one_shot: "timing", debounce: "timing", pulse_str: "timing",
  flasher: "oscillator", hazard: "oscillator", burst: "oscillator", pwm_out: "oscillator",
  threshold: "threshold", hysteresis: "threshold", window: "threshold", adc_map: "threshold",
  sr_latch: "stateful", toggle: "stateful", interlock: "stateful",
  prio_or: "stateful", n_press: "stateful",
  oc_latch: "protective", retry: "protective", therm_drt: "protective", watchdog: "protective",
  can_sig: "can_rx", can_thr: "can_rx", can_map: "can_rx",
  can_timeout: "can_rx", can_hrx: "can_rx", can_cmd_out: "can_rx",
  can_tx_st: "can_tx", can_tx_an: "can_tx", can_htx: "can_tx", can_boff: "can_tx",
};

/** Find the canvas node id for a pin or group name. */
function resolveNodeId(name: string, pins: Pin[], groups: Group[]): string | null {
  if (groups.some((g) => g.name === name)) return `grp_${name}`;
  const pin = pins.find((p) => p.name === name);
  if (pin) {
    if (pin.type === "din" || pin.type === "adc") return `in_${name}`;
    if (pin.type === "dout" || pin.type === "pwm") return `out_${name}`;
  }
  return null;
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  opts: Partial<Edge> = {},
): Edge {
  return { id, source, target, sourceHandle: null, targetHandle: null, ...opts };
}

function makeDirectEdge(srcId: string, dstId: string): Edge {
  return makeEdge(`e-${srcId}-${dstId}`, srcId, dstId, {
    label: "direct",
    animated: true,
    style: { stroke: "#22c55e", strokeWidth: 2 },
    labelStyle: { fill: "#22c55e", fontSize: 10 },
    labelBgStyle: { fill: "#18181b" },
    data: { ruleType: "direct" },
  });
}

/**
 * Convert a list of parsed rules back into React Flow nodes and edges.
 * Returns only the rule nodes and edges; static pin/group nodes are
 * built separately in LogicCanvas.
 */
export function rulesToCanvas(
  rules: Rule[],
  pins: Pin[],
  groups: Group[],
): { ruleNodes: Node[]; edges: Edge[] } {
  const ruleNodes: Node[] = [];
  const edges: Edge[] = [];

  rules.forEach((rule, layoutIdx) => {
    const srcId  = rule.src  ? resolveNodeId(rule.src,  pins, groups) : null;
    const src2Id = rule.src2 ? resolveNodeId(rule.src2, pins, groups) : null;
    const dstId  = rule.dst  ? resolveNodeId(rule.dst,  pins, groups) : null;

    if (rule.type === "direct" && srcId && dstId) {
      edges.push(makeDirectEdge(srcId, dstId));
      return;
    }

    // Place rule nodes in a centre column, staggered vertically
    const nodeId = `loaded_rule_${rule.index}`;
    const ruleNodeData: RuleNodeData = {
      ruleType: rule.type,
      label: rule.type,
      category: RULE_CATEGORIES[rule.type] ?? "combinational",
      params: {},
    };

    ruleNodes.push({
      id: nodeId,
      type: "rule",
      position: { x: 480, y: 60 + layoutIdx * 90 },
      data: ruleNodeData as unknown as Record<string, unknown>,
    });

    if (srcId) {
      edges.push(makeEdge(`e-${srcId}-${nodeId}`, srcId, nodeId, { animated: true }));
    }
    if (src2Id) {
      edges.push(makeEdge(`e-${src2Id}-${nodeId}`, src2Id, nodeId, { animated: true }));
    }
    if (dstId) {
      edges.push(makeEdge(`e-${nodeId}-${dstId}`, nodeId, dstId, { animated: true }));
    }
  });

  return { ruleNodes, edges };
}
