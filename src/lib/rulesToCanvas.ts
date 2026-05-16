import type { Node, Edge } from "@xyflow/react";
import type { Pin, Group, Rule } from "../types/config";
import type { RuleNodeData } from "../components/canvas/nodes/RuleNode";
import { parseExpr, type ExprAST } from "./exprParser";

const RULE_CATEGORIES: Record<string, string> = {
  expr: "expression",
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

/** Mutable accumulator passed through tree helpers. */
interface BuildCtx {
  pins: Pin[];
  groups: Group[];
  nodes: Node[];
  edges: Edge[];
}

function resolveNodeId(name: string, pins: Pin[], groups: Group[]): string | null {
  if (groups.some((g) => g.name === name)) return `grp_${name}`;
  const pin = pins.find((p) => p.name === name);
  if (pin) {
    if (pin.type === "din" || pin.type === "adc") return `in_${name}`;
    if (pin.type === "dout" || pin.type === "pwm") return `out_${name}`;
  }
  return null;
}

function makeEdge(id: string, source: string, target: string, opts: Partial<Edge> = {}): Edge {
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

// ── Expression tree → canvas ─────────────────────────────────────────────────

function countLeaves(ast: ExprAST): number {
  if (ast.op === "IDENT") return 1;
  return ast.args.reduce((sum, a) => sum + countLeaves(a), 0);
}

/**
 * Recursively convert an expression AST into ReactFlow nodes/edges.
 * `path` encodes the position in the tree (e.g. "n", "n0", "n1", "n00")
 * so the same expression always produces the same node IDs — stable for
 * position persistence.
 */
function astToNodes(
  ast: ExprAST,
  x: number,
  y: number,
  prefix: string,
  ctx: BuildCtx,
  path = "n",
): string | null {
  if (ast.op === "IDENT") return resolveNodeId(ast.name, ctx.pins, ctx.groups);

  const id = `${prefix}_${path}`;
  ctx.nodes.push({
    id,
    type: "expr",
    position: { x, y },
    data: { op: ast.op } as unknown as Record<string, unknown>,
  });

  const leaves = ast.args.map(countLeaves);
  const total = leaves.reduce((s, l) => s + l, 0);
  const spread = Math.max(total * 60, 80);
  let yTop = y - spread / 2;

  ast.args.forEach((child, i) => {
    const fraction = leaves[i] / total;
    const childY = yTop + (fraction * spread) / 2;
    yTop += fraction * spread;
    const childId = astToNodes(child, x - 180, childY, prefix, ctx, `${path}${i}`);
    if (childId) {
      ctx.edges.push(makeEdge(`e-${childId}-${id}-t${i}`, childId, id, {
        animated: true,
        targetHandle: `t${i}`,
      }));
    }
  });

  return id;
}

function addExprRule(rule: Rule, layoutIdx: number, dstId: string | null, ctx: BuildCtx): void {
  const tokens = rule.srcs ?? (rule.src ? [rule.src] : []);
  const ast = parseExpr(tokens.join(" "));
  if (!ast || !dstId) return;

  const rootId = astToNodes(ast, 700, 60 + layoutIdx * 120, `r${rule.index}`, ctx);
  if (rootId) {
    ctx.edges.push(makeEdge(`e-${rootId}-${dstId}`, rootId, dstId, { animated: true }));
  }
}

function addRuleNode(
  rule: Rule,
  layoutIdx: number,
  srcId: string | null,
  src2Id: string | null,
  dstId: string | null,
  ctx: BuildCtx,
): void {
  const nodeId = `loaded_rule_${rule.index}`;
  const data: RuleNodeData = {
    ruleType: rule.type,
    label: rule.type,
    category: RULE_CATEGORIES[rule.type] ?? "combinational",
    params: {},
  };

  ctx.nodes.push({
    id: nodeId,
    type: "rule",
    position: { x: 480, y: 60 + layoutIdx * 90 },
    data: data as unknown as Record<string, unknown>,
  });

  if (srcId)  ctx.edges.push(makeEdge(`e-${srcId}-${nodeId}`,  srcId,  nodeId, { animated: true }));
  if (src2Id) ctx.edges.push(makeEdge(`e-${src2Id}-${nodeId}`, src2Id, nodeId, { animated: true }));
  if (dstId)  ctx.edges.push(makeEdge(`e-${nodeId}-${dstId}`,  nodeId, dstId,  { animated: true }));
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Convert a list of parsed rules back into React Flow nodes and edges.
 * Returns only the rule/expr nodes and edges; static pin/group nodes are
 * built separately in LogicCanvas.
 */
export function rulesToCanvas(
  rules: Rule[],
  pins: Pin[],
  groups: Group[],
): { ruleNodes: Node[]; edges: Edge[] } {
  const ctx: BuildCtx = { pins, groups, nodes: [], edges: [] };

  rules.forEach((rule, layoutIdx) => {
    const srcId  = rule.src  ? resolveNodeId(rule.src,  pins, groups) : null;
    const src2Id = rule.src2 ? resolveNodeId(rule.src2, pins, groups) : null;
    const dstId  = rule.dst  ? resolveNodeId(rule.dst,  pins, groups) : null;

    if (rule.type === "direct" && srcId && dstId) {
      ctx.edges.push(makeDirectEdge(srcId, dstId));
    } else if (rule.type === "expr") {
      addExprRule(rule, layoutIdx, dstId, ctx);
    } else {
      addRuleNode(rule, layoutIdx, srcId, src2Id, dstId, ctx);
    }
  });

  return { ruleNodes: ctx.nodes, edges: ctx.edges };
}
