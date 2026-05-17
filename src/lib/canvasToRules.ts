import type { Node, Edge } from "@xyflow/react";
import type { RuleNodeData } from "../components/canvas/nodes/RuleNode";
import type { ExprNodeData } from "../components/canvas/nodes/ExprNode";

// ── CAN templates ────────────────────────────────────────────────────────────

type CanTemplate = (p: Record<string, string | number>, src: string, dst: string) => string;

const CAN_TEMPLATES: Record<string, CanTemplate> = {
  can_sig:  (p, _, dst) => `can_sig ${p.cid ?? "0x100"} ${p.cby ?? 0} ${p.cbi ?? 0} ${p.cln ?? 8} ${dst} ${p.tlo ?? 128}`,
  can_thr:  (p, _, dst) => `can_thr ${p.cid ?? "0x100"} ${p.cby ?? 0} ${p.cbi ?? 0} ${p.cln ?? 8} ${dst} ${p.tlo ?? 100} ${p.thi ?? 200}`,
  can_map:  (p, _, dst) => `can_map ${p.cid ?? "0x100"} ${p.cby ?? 0} ${p.cbi ?? 0} ${p.cln ?? 8} ${dst} ${p.tlo ?? 0} ${p.thi ?? 255} ${p.olo ?? 0} ${p.ohi ?? 100}`,
  can_timeout: (p, _, dst) => `can_timeout ${p.cid ?? "0x100"} ${dst} ${p.window ?? 1000}`,
  can_hrx:  (p, _, dst) => `can_hrx ${p.cid ?? "0x100"} ${dst} ${p.window ?? 1000}`,
  can_cmd_out: (p, _, dst) => `can_cmd_out ${p.cid ?? "0x100"} ${p.cby ?? 0} ${p.tlo ?? 1} ${dst}`,
  can_tx_st: (p, src) =>   `can_tx_st ${src} ${p.cid ?? "0x200"} ${p.interval ?? 100}`,
  can_tx_an: (p, src) =>   `can_tx_an ${src} ${p.cid ?? "0x200"} ${p.cby ?? 0} ${p.interval ?? 100}`,
  can_htx:  (p) =>          `can_htx ${p.cid ?? "0x200"} ${p.interval ?? 1000}`,
  can_boff: (_, __, dst) => `can_boff ${dst}`,
};

// ── Rule spec table ─────────────────────────────────────────────────────────
// mode: how src/dst/params are ordered in the RS_AddRule command
//   "src_dst"    → type  src...  dst  params   (most rules)
//   "slash_src"  → type  src1/src2  dst         (xor, sr_latch — firmware uses slash separator)
//   "dst_params" → type  dst     params         (CAN RX that pull from CAN bus)
//   "src_params" → type  src     params         (CAN TX — dst is the CAN frame)
//   "params"     → type  params                 (can_htx — no pin src or dst)

type RuleMode = "src_dst" | "slash_src" | "dst_params" | "src_params" | "params";

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
  xor:       { mode: "slash_src", src: 2, params: [] },
  nand_nor:  { mode: "src_dst", src: 2, params: [] },
  // Timing
  on_delay:  { mode: "src_dst", src: 1, params: [["delay", "100"]] },
  off_delay: { mode: "src_dst", src: 1, params: [["delay", "100"]] },
  min_on:    { mode: "src_dst", src: 1, params: [["delay", "100"]] },
  one_shot:  { mode: "src_dst", src: 1, params: [["delay", "100"]] },
  debounce:  { mode: "src_dst", src: 1, params: [["delay", "20"]] },
  // Oscillator
  flasher:   { mode: "src_dst", src: 1, params: [["on", "500"], ["off", "500"]] },
  hazard:    { mode: "src_dst", src: 1, params: [["on", "500"], ["off", "500"], ["count", "3"]] },
  burst:     { mode: "src_dst", src: 1, params: [["on", "100"], ["off", "100"], ["count", "3"]] },
  pwm_out:   { mode: "src_dst", src: 1, params: [["freq", "1000"], ["duty", "50"]] },
  // Threshold
  threshold: { mode: "src_dst", src: 1, params: [["thi", "2500"], ["tlo", "1500"]] },
  hysteresis:{ mode: "src_dst", src: 1, params: [["thi", "2500"], ["tlo", "1500"]] },
  window:    { mode: "src_dst", src: 1, params: [["tlo", "1000"], ["thi", "3000"]] },
  adc_map:   { mode: "src_dst", src: 1, params: [["tlo", "0"], ["thi", "3300"], ["olo", "0"], ["ohi", "100"]] },
  // Stateful
  sr_latch:  { mode: "slash_src", src: 2, params: [] },
  toggle:    { mode: "src_dst", src: 1, params: [] },
  interlock: { mode: "src_dst", src: 2, params: [] },
  prio_or:   { mode: "src_dst", src: 2, params: [] },
  n_press:   { mode: "src_dst", src: 1, params: [] },
  // Protective
  oc_latch:  { mode: "src_dst", src: 1, params: [["delay", "1000"]] },
  retry:     { mode: "src_dst", src: 1, params: [["delay", "1000"]] },
  therm_drt: { mode: "src_dst", src: 1, params: [["thi", "80"], ["tlo", "60"]] },
  watchdog:  { mode: "src_dst", src: 1, params: [["window", "5000"]] },
  // CAN — command generation handled by CAN_TEMPLATES; entries here are only for needsDst lookup
  can_sig:     { mode: "dst_params", src: 0, params: [] },
  can_thr:     { mode: "dst_params", src: 0, params: [] },
  can_map:     { mode: "dst_params", src: 0, params: [] },
  can_hrx:     { mode: "dst_params", src: 0, params: [] },
  can_cmd_out: { mode: "dst_params", src: 0, params: [] },
  can_timeout: { mode: "dst_params", src: 0, params: [] },
  can_tx_st:  { mode: "src_params", src: 1, params: [] },
  can_tx_an:  { mode: "src_params", src: 1, params: [] },
  can_boff:   { mode: "dst_params", src: 0, params: [] },
  can_htx:    { mode: "params",     src: 0, params: [] },
};

type ModeParts = (srcs: string[], dst: string, pv: string[]) => string[];

const MODE_PARTS: Record<RuleMode, ModeParts> = {
  src_dst:    (srcs, dst, pv)  => [...srcs, dst, ...pv],
  slash_src:  (srcs, dst, pv)  => [srcs.slice(0, 2).join("/"), dst, ...pv],
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

function buildCanCmd(
  type: string,
  params: Record<string, string | number>,
  node: Node,
  nodes: Node[],
  edges: Edge[],
): string[] {
  const template = CAN_TEMPLATES[type];
  if (!template) return [];

  const CAN_RX_DST = new Set(["can_sig", "can_thr", "can_map", "can_timeout", "can_hrx", "can_cmd_out", "can_boff"]);
  const CAN_TX_SRC = new Set(["can_tx_st", "can_tx_an"]);

  // For CAN TX: if the source is a rule/expr node, reuse its named output signal
  // (so no extra rule is needed) or fall back to a virtual intermediate signal.
  let srcLabel = edges
    .filter((e) => e.target === node.id)
    .map((e) => nodeLabel(e.source, nodes))
    .find((s): s is string => s !== null) ?? "";

  if (!srcLabel && CAN_TX_SRC.has(type)) {
    const srcEdge = edges.find((e) => e.target === node.id);
    if (srcEdge) {
      const srcNode = nodes.find((n) => n.id === srcEdge.source);
      if (srcNode?.type === "rule" || srcNode?.type === "expr") {
        const upstreamNamedOut = edges
          .filter((e) => e.source === srcNode.id && e.target !== node.id)
          .map((e) => nodeLabel(e.target, nodes))
          .find((s): s is string => s !== null);
        srcLabel = upstreamNamedOut ?? `_virt_${srcNode.id}`;
      }
    }
  }

  // For CAN RX: resolve dst from named nodes first; if the outgoing edge targets
  // another rule node instead, emit a virtual intermediate signal named after this node.
  let dstLabel = edges
    .filter((e) => e.source === node.id)
    .map((e) => nodeLabel(e.target, nodes))
    .find((s): s is string => s !== null) ?? "";

  if (!dstLabel && CAN_RX_DST.has(type)) {
    const hasRuleDst = edges.some((e) => {
      if (e.source !== node.id) return false;
      return nodes.find((n) => n.id === e.target)?.type === "rule";
    });
    if (hasRuleDst) dstLabel = `_virt_${node.id}`;
  }

  if (CAN_RX_DST.has(type) && !dstLabel) return [];
  if (CAN_TX_SRC.has(type) && !srcLabel) return [];

  return [`RS_AddRule ${template(params, srcLabel, dstLabel)}`];
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

  // Expr nodes that drive a rule block (flasher, timing, CAN TX, etc.) need a virtual
  // intermediate signal so the downstream rule has a signal name to reference.
  // Pure-intermediate nodes (all outputs feed other expr nodes) are skipped — their
  // sub-expression is already inlined by the parent node's buildExprStr recursion.
  for (const node of nodes.filter((n) => n.type === "expr")) {
    const outEdges = edges.filter((e) => e.source === node.id);
    if (outEdges.length === 0) continue;

    if (outEdges.every((e) => nodes.find((x) => x.id === e.target)?.type === "expr")) continue;

    const hasRuleDst = outEdges.some((e) => nodes.find((x) => x.id === e.target)?.type === "rule");
    if (!hasRuleDst) continue;

    const exprStr = buildExprStr(node.id, nodes, edges);
    if (exprStr) cmds.push(`RS_AddRule expr _virt_${node.id} ${exprStr}`);
  }

  return cmds;
}

/** Resolves the signal label for an edge's source node.
 *  Named nodes return their label; CAN RX rule nodes and expr gate nodes return a virtual signal name. */
function resolveSourceLabel(sourceId: string, nodes: Node[], edges: Edge[]): string | null {
  const named = nodeLabel(sourceId, nodes);
  if (named !== null) return named;
  const srcNode = nodes.find((n) => n.id === sourceId);
  if (!srcNode) return null;
  if (srcNode.type === "expr") return `_virt_${sourceId}`;
  if (srcNode.type !== "rule") return null;
  const srcData = srcNode.data as unknown as RuleNodeData;
  return srcData.category === "can_rx" ? `_virt_${sourceId}` : null;
}

function isCanTxNode(nodeId: string, nodes: Node[]): boolean {
  const n = nodes.find((x) => x.id === nodeId);
  return n?.type === "rule" && (n.data as unknown as RuleNodeData).category === "can_tx";
}

function buildRuleNodeCmds(node: Node, nodes: Node[], edges: Edge[]): string[] {
  const cmds: string[] = [];
  const d = node.data as unknown as RuleNodeData;

  if (d.ruleType in CAN_TEMPLATES) {
    return buildCanCmd(d.ruleType, d.params ?? {}, node, nodes, edges);
  }

  const sources = edges
    .filter((e) => e.target === node.id)
    .map((e) => resolveSourceLabel(e.source, nodes, edges))
    .filter((s): s is string => s !== null);

  const dests = edges
    .filter((e) => e.source === node.id)
    .map((e) => nodeLabel(e.target, nodes))
    .filter((s): s is string => s !== null);

  // If this rule has no named output but feeds a CAN TX block directly,
  // emit to a virtual signal so the CAN TX has something to reference.
  if (dests.length === 0) {
    const hasCanTxDst = edges.some((e) => e.source === node.id && isCanTxNode(e.target, nodes));
    if (hasCanTxDst) dests.push(`_virt_${node.id}`);
  }

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
