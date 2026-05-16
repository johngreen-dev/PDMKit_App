import { Trash2, RefreshCw } from "lucide-react";
import { useConfigStore } from "../../stores/configStore";
import { useDeviceStore } from "../../stores/deviceStore";
import type { Rule } from "../../types/config";

function RuleRow({ r, onRemove }: { readonly r: Rule; readonly onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded bg-zinc-800 group font-mono text-xs">
      <span className="text-zinc-500 w-5 text-right shrink-0">{r.index}</span>
      <span className="px-1.5 py-0.5 rounded bg-zinc-700 text-blue-300 shrink-0">{r.type}</span>
      <span className="text-zinc-300 flex-1 truncate">{r.raw}</span>
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
