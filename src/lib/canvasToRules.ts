import type { Node, Edge } from "@xyflow/react";
import type { RuleNodeData } from "../components/canvas/nodes/RuleNode";
import type { ExprNodeData } from "../components/canvas/nodes/ExprNode";

// ── Rule spec table ─────────────────────────────────────────────────────────
// mode: how src/dst/params are ordered in the RS_AddRule command
//   "src_dst"   → type  src...  dst  params   (most rules)
//   "dst_params"→ type  dst     params         (CAN RX that pull from CAN bus)
//   "src_params"→ type  src     params         (CAN TX — dst is the CAN frame)
//   "params"    → type  params                 (can_htx — no pin src or dst)

type RuleMode = "src_dst" | "dst_params" | "src_params" | "params";

interface RuleSpec {
  mode: RuleMode;
  src: number;                     // minimum source count required
  params: Array<[string, string]>; // [param key, default value] in order
}

const RULES: Record<string, RuleSpec> = {
  // Combinational
  direct:    { mode: "src_dst", src: 1, params: [] },
  not:       { mode: "src_dst", src: 1, params: [] },
  and:       { mode: "src_dst", src: 2, params: [] },
  or:        { mode: "src_dst", src: 2, params: [] },
  xor:       { mode: "src_dst", src: 2, params: [] },
  nand_nor:  { mode: "src_dst", src: 2, params: [] },
  // Timing
  on_delay:  { mode: "src_dst", src: 1, params: [["delay", "100"]] },
  off_delay: { mode: "src_dst", src: 1, params: [["delay", "100"]] },
  min_on:    { mode: "src_dst", src: 1, params: [["delay", "100"]] },
  one_shot:  { mode: "src_dst", src: 1, params: [["delay", "100"]] },
  debounce:  { mode: "src_dst", src: 1, params: [["delay", "20"]] },
  // Oscillator
  flasher:   { mode: "src_dst", src: 1, params: [["on", "500"], ["off", "500"]] },
  hazard:    { mode: "src_dst", src: 1, params: [["on", "500"], ["off", "500"]] },
  burst:     { mode: "src_dst", src: 1, params: [["on", "100"], ["off", "100"], ["count", "3"]] },
  pwm_out:   { mode: "src_dst", src: 1, params: [["freq", "1000"], ["duty", "50"]] },
  // Threshold
  threshold: { mode: "src_dst", src: 1, params: [["thi", "2500"], ["tlo", "1500"]] },
  hysteresis:{ mode: "src_dst", src: 1, params: [["thi", "2500"], ["tlo", "1500"]] },
  window:    { mode: "src_dst", src: 1, params: [["tlo", "1000"], ["thi", "3000"]] },
  adc_map:   { mode: "src_dst", src: 1, params: [["tlo", "0"], ["thi", "3300"], ["olo", "0"], ["ohi", "100"]] },
  // Stateful
  sr_latch:  { mode: "src_dst", src: 2, params: [] },
  toggle:    { mode: "src_dst", src: 1, params: [] },
  interlock: { mode: "src_dst", src: 2, params: [] },
  prio_or:   { mode: "src_dst", src: 2, params: [] },
  n_press:   { mode: "src_dst", src: 1, params: [] },
  // Protective
  oc_latch:  { mode: "src_dst", src: 1, params: [["delay", "1000"]] },
  retry:     { mode: "src_dst", src: 1, params: [["delay", "1000"]] },
  therm_drt: { mode: "src_dst", src: 1, params: [["thi", "80"], ["tlo", "60"]] },
  watchdog:  { mode: "src_dst", src: 1, params: [["window", "5000"]] },
  // CAN RX — dst is the output pin; CAN frame ID/fields are params
  can_sig:     { mode: "dst_params", src: 0, params: [["cid", "0x100"], ["cby", "0"], ["cbi", "0"], ["cln", "8"], ["thi", "100"], ["tlo", "50"]] },
  can_thr:     { mode: "dst_params", src: 0, params: [["cid", "0x100"], ["cby", "0"], ["cbi", "0"], ["cln", "8"], ["thi", "100"], ["tlo", "50"]] },
  can_map:     { mode: "dst_params", src: 0, params: [["cid", "0x100"], ["cby", "0"], ["cbi", "0"], ["cln", "8"], ["tlo", "0"], ["thi", "255"], ["olo", "0"], ["ohi", "100"]] },
  can_hrx:     { mode: "dst_params", src: 0, params: [["cid", "0x100"], ["window", "1000"]] },
  can_cmd_out: { mode: "dst_params", src: 0, params: [["cid", "0x100"], ["cby", "0"], ["cbi", "0"]] },
  can_timeout: { mode: "src_dst",    src: 1, params: [["window", "1000"]] },
  // CAN TX — src is the pin to transmit; no output pin dst
  can_tx_st: { mode: "src_params", src: 1, params: [["cid", "0x200"], ["cby", "0"], ["cbi", "0"], ["interval", "100"]] },
  can_tx_an: { mode: "src_params", src: 1, params: [["cid", "0x200"], ["cby", "0"], ["cln", "8"], ["interval", "100"]] },
  can_boff:  { mode: "src_params", src: 1, params: [["cid", "0x200"], ["cby", "0"], ["cbi", "0"]] },
  can_htx:   { mode: "params",     src: 0, params: [["cid", "0x200"], ["interval", "1000"]] },
};

type ModeParts = (srcs: string[], dst: string, pv: string[]) => string[];

const MODE_PARTS: Record<RuleMode, ModeParts> = {
  src_dst:    (srcs, dst, pv)  => [...srcs, dst, ...pv],
  dst_params: (_s,   dst, pv)  => [dst, ...pv],
  src_params: (srcs, _d,  pv)  => [...srcs, ...pv],
  params:     (_s,   _d,  pv)  => pv,
};

function buildSingleRule(
  type: string,
  sources: string[],
  dst: string,
  params: Record<string, string | number>,
): string | null {
  const spec = RULES[type] ?? ({ mode: "src_dst", src: 1, params: [] } satisfies RuleSpec);
  if (sources.length < spec.src) return null;

  const srcs = sources.slice(0, spec.src);
  const pv   = spec.params.map(([k, d]) => String(params[k] ?? d));
  const tail = MODE_PARTS[spec.mode](srcs, dst, pv).join(" ");

  return `RS_AddRule ${type} ${tail}`.trimEnd();
}

// ── Expression tree ──────────────────────────────────────────────────────────

function nodeLabel(nodeId: string, nodes: Node[]): string | null {
  const n = nodes.find((x) => x.id === nodeId);
  if (!n) return null;
  if (n.type === "input_pin" || n.type === "output_pin" || n.type === "group") {
    return (n.data as { label: string }).label;
  }
  return null;
}

/** Recursively build a boolean expression string from an expr node subtree. */
function buildExprStr(nodeId: string, nodes: Node[], edges: Edge[]): string | null {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const label = nodeLabel(nodeId, nodes);
  if (label !== null) return label;

  if (node.type !== "expr") return null;

  const { op } = node.data as unknown as ExprNodeData;
  const inputs = edges
    .filter((e) => e.target === nodeId)
    .map((e) => buildExprStr(e.source, nodes, edges))
    .filter((s): s is string => s !== null);

  if (inputs.length === 0) return null;

  if (op === "NOT") {
    const inner = inputs[0];
    const operand = inner.includes(" ") ? "(" + inner + ")" : inner;
    return "NOT " + operand;
  }

  if (inputs.length === 1) return inputs[0];
  return "(" + inputs.join(" " + op + " ") + ")";
}

function buildExprRules(nodes: Node[], edges: Edge[]): string[] {
  const cmds: string[] = [];
  const dstNodes = nodes.filter((n) => n.type === "output_pin" || n.type === "group");

  for (const dst of dstNodes) {
    const dstLabel = (dst.data as { label: string }).label;
    for (const e of edges.filter((ed) => ed.target === dst.id)) {
      const src = nodes.find((n) => n.id === e.source);
      if (src?.type !== "expr") continue;
      const exprStr = buildExprStr(e.source, nodes, edges);
      if (exprStr) cmds.push(`RS_AddRule expr ${dstLabel} ${exprStr}`);
    }
  }

  return cmds;
}

function buildRuleNodeCmds(node: Node, nodes: Node[], edges: Edge[]): string[] {
  const cmds: string[] = [];
  const d = node.data as unknown as RuleNodeData;

  const sources = edges
    .filter((e) => e.target === node.id)
    .map((e) => nodeLabel(e.source, nodes))
    .filter((s): s is string => s !== null);

  const dests = edges
    .filter((e) => e.source === node.id)
    .map((e) => nodeLabel(e.target, nodes))
    .filter((s): s is string => s !== null);

  const spec = RULES[d.ruleType];
  const needsDst = !spec || spec.mode === "src_dst" || spec.mode === "dst_params";

  if (needsDst && dests.length === 0) return cmds;

  const dstList = needsDst ? dests : [""];
  for (const dst of dstList) {
    const cmd = buildSingleRule(d.ruleType, sources, dst, d.params ?? {});
    if (cmd) cmds.push(cmd);
  }

  return cmds;
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Returns a list of RS_AddRule command strings derived from the canvas state. */
export function buildRuleCommands(nodes: Node[], edges: Edge[]): string[] {
  const cmds: string[] = [];

  // Direct edges (named-node → named-node, green edges)
  for (const e of edges) {
    if ((e.data as { ruleType?: string } | undefined)?.ruleType === "direct") {
      const src = nodeLabel(e.source, nodes);
      const dst = nodeLabel(e.target, nodes);
      if (src && dst) cmds.push(`RS_AddRule direct ${src} ${dst}`);
    }
  }

  // Expression trees → RS_AddRule expr
  cmds.push(...buildExprRules(nodes, edges));

  // Rule nodes
  for (const node of nodes.filter((n) => n.type === "rule")) {
    cmds.push(...buildRuleNodeCmds(node, nodes, edges));
  }

  return cmds;
}
