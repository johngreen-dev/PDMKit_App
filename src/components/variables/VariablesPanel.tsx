import { useState } from "react";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { useConfigStore } from "../../stores/configStore";
import { useDeviceStore } from "../../stores/deviceStore";

export function VariablesPanel() {
  const { variables, addVar, removeVar, loadVars } = useConfigStore();
  const { inSetup, appendLog } = useDeviceStore();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [expr, setExpr] = useState("");

  const handleAdd = async () => {
    if (!name.trim() || !expr.trim()) return;
    try {
      await addVar({ name: name.trim().toUpperCase(), expr: expr.trim() });
      setShowForm(false);
      setName("");
      setExpr("");
    } catch (e) {
      appendLog(`ERR AddVar: ${e}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700 shrink-0">
        <h2 className="font-semibold text-zinc-200 flex-1">Variables</h2>
        <button onClick={loadVars} className="p-1 rounded hover:bg-zinc-700 text-zinc-400" title="Refresh">
          <RefreshCw size={14} />
        </button>
        <button
          onClick={() => setShowForm(true)}
          disabled={!inSetup}
          className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {variables.length === 0 && (
          <div className="text-zinc-500 text-xs text-center mt-8">No variables configured</div>
        )}
        {variables.map((v) => (
          <div key={v.name} className="px-3 py-2 rounded bg-zinc-800 group flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-zinc-100">{v.name}</span>
              {inSetup && (
                <button
                  onClick={() => removeVar(v.name).catch((e) => appendLog(`ERR: ${e}`))}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-900 text-zinc-500 hover:text-red-300 transition-opacity ml-auto"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <span className="text-zinc-400 text-xs font-mono">{v.expr}</span>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-5 w-96 flex flex-col gap-3">
            <h2 className="font-semibold text-base">Add Variable</h2>
            <label className="flex flex-col gap-1">
              <span className="text-zinc-400 text-xs">Name</span>
              <input
                autoFocus
                className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm font-mono"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                placeholder="BOTH_ON"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-zinc-400 text-xs">Expression</span>
              <input
                className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm font-mono"
                value={expr}
                onChange={(e) => setExpr(e.target.value)}
                placeholder="SW1 AND SW2"
              />
              <span className="text-zinc-500 text-[10px]">Use AND, OR, NOT and pin/group names</span>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowForm(false)} className="px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-xs">Cancel</button>
              <button onClick={handleAdd} disabled={!name.trim() || !expr.trim()} className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
