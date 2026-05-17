import { Trash2, RefreshCw } from "lucide-react";
import { useConfigStore } from "../../stores/configStore";
import { useDeviceStore } from "../../stores/deviceStore";
import type { Rule } from "../../types/config";

const CAN_RX = new Set(["can_sig", "can_thr", "can_map", "can_timeout", "can_hrx", "can_cmd_out", "can_boff"]);
const CAN_TX = new Set(["can_tx_st", "can_tx_an", "can_htx"]);

function fmtCid(cid: number): string {
  return "0x" + cid.toString(16).toUpperCase();
}

function fmtThresh(tlo: number | undefined, thi: number | undefined): string {
  if (tlo !== undefined && thi !== undefined) return `${tlo}..${thi}`;
  if (tlo !== undefined) return `thr:${tlo}`;
  return "";
}

function fmtCanRx(r: Rule): string {
  const parts: string[] = [];
  if (r.cid !== undefined) parts.push(`CAN[${fmtCid(r.cid)}]`);
  if (r.dst) parts.push("→", r.dst);
  if (r.cby !== undefined || r.cbi !== undefined) {
    const len = r.cln !== undefined && r.cln !== 8 ? `:${r.cln}` : "";
    parts.push(`b${r.cby ?? 0}.${r.cbi ?? 0}${len}`);
  }
  const thresh = fmtThresh(r.tlo, r.thi);
  if (thresh) parts.push(thresh);
  if (r.window !== undefined) parts.push(`win:${r.window}ms`);
  return parts.join(" ");
}

function fmtCanTx(r: Rule): string {
  const parts: string[] = [];
  if (r.src) parts.push(r.src);
  if (r.cid !== undefined) parts.push("→", `CAN[${fmtCid(r.cid)}]`);
  if (r.cby !== undefined && r.cby !== 0) parts.push(`b${r.cby}`);
  if (r.pb !== undefined) parts.push(`@${r.pb}ms`);
  return parts.join(" ");
}

function fmtGeneral(r: Rule): string {
  const parts: string[] = [];
  if (r.src)  parts.push(r.src);
  if (r.src2) parts.push(r.src2);
  if (r.dst)  parts.push("→", r.dst);
  if (r.delay  !== undefined) parts.push(`${r.delay}ms`);
  if (r.on     !== undefined) parts.push(`on:${r.on}ms`);
  if (r.off    !== undefined) parts.push(`off:${r.off}ms`);
  if (r.window !== undefined) parts.push(`win:${r.window}ms`);
  const thresh = fmtThresh(r.tlo, r.thi);
  if (thresh) parts.push(`${thresh}mV`);
  if (r.pb !== undefined) parts.push(`@${r.pb}ms`);
  return parts.join(" ");
}

function fmtRule(r: Rule): string {
  if (r.type === "expr") return `${r.dst ?? "?"}: ${r.expr ?? r.raw ?? ""}`;
  if (CAN_RX.has(r.type)) return fmtCanRx(r);
  if (CAN_TX.has(r.type)) return fmtCanTx(r);
  return fmtGeneral(r) || r.raw || "";
}

function RuleRow({ r, onRemove }: { readonly r: Rule; readonly onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded bg-zinc-800 group font-mono text-xs">
      <span className="text-zinc-500 w-5 text-right shrink-0">{r.index}</span>
      <span className="px-1.5 py-0.5 rounded bg-zinc-700 text-blue-300 shrink-0">{r.type}</span>
      <span className="text-zinc-300 flex-1 truncate">{fmtRule(r)}</span>
      {onRemove && (
        <button
          type="button"
          title="Remove rule"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-900 text-zinc-500 hover:text-red-300 transition-opacity"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

function SectionHeader({ label, count }: { readonly label: string; readonly count: number }) {
  return (
    <div className="flex items-center gap-2 px-1 pt-1">
      <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">{label}</span>
      <span className="text-[10px] text-zinc-600">{count}</span>
    </div>
  );
}

export function RulesPanel() {
  const { rules, removeRule, loadRules } = useConfigStore();
  const { inSetup, appendLog } = useDeviceStore();

  const exprRules = rules.filter((r) => r.type === "expr");
  const otherRules = rules.filter((r) => r.type !== "expr");

  const makeRemove = (index: number) =>
    inSetup ? () => removeRule(index).catch((e: unknown) => appendLog(`ERR: ${e}`)) : undefined;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700 shrink-0">
        <h2 className="font-semibold text-zinc-200 flex-1">Rules</h2>
        <span className="text-zinc-500 text-xs">Edit via Logic Canvas</span>
        <button type="button" onClick={loadRules} className="p-1 rounded hover:bg-zinc-700 text-zinc-400" title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {rules.length === 0 && (
          <div className="text-zinc-500 text-xs text-center mt-8">No rules configured</div>
        )}

        {exprRules.length > 0 && (
          <>
            <SectionHeader label="Expressions" count={exprRules.length} />
            {exprRules.map((r) => (
              <RuleRow key={r.index} r={r} onRemove={makeRemove(r.index)} />
            ))}
          </>
        )}

        {otherRules.length > 0 && (
          <>
            <SectionHeader label="Rules" count={otherRules.length} />
            {otherRules.map((r) => (
              <RuleRow key={r.index} r={r} onRemove={makeRemove(r.index)} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
