import { useState } from "react";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { useConfigStore } from "../../stores/configStore";
import { useDeviceStore } from "../../stores/deviceStore";

export function GroupsPanel() {
  const { groups, pins, addGroup, removeGroup, loadGroups } = useConfigStore();
  const { inSetup, appendLog } = useDeviceStore();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const pinNames = pins.map((p) => p.name);

  const toggleMember = (n: string) =>
    setSelected((s) => s.includes(n) ? s.filter((x) => x !== n) : [...s, n]);

  const handleAdd = async () => {
    if (!name.trim() || selected.length === 0) return;
    try {
      await addGroup({ name: name.trim().toUpperCase(), members: selected });
      setShowForm(false);
      setName("");
      setSelected([]);
    } catch (e) {
      appendLog(`ERR AddGroup: ${e}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700 shrink-0">
        <h2 className="font-semibold text-zinc-200 flex-1">Groups</h2>
        <button type="button" onClick={loadGroups} className="p-1 rounded hover:bg-zinc-700 text-zinc-400" title="Refresh">
          <RefreshCw size={14} />
        </button>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={!inSetup}
          className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {groups.length === 0 && (
          <div className="text-zinc-500 text-xs text-center mt-8">No groups configured</div>
        )}
        {groups.map((g) => (
          <div key={g.name} className="px-3 py-2 rounded bg-zinc-800 group flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-zinc-100 flex-1">{g.name}</span>
              {inSetup && (
                <button
                  type="button"
                  title={`Remove ${g.name}`}
                  onClick={() => removeGroup(g.name).catch((e) => appendLog(`ERR: ${e}`))}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-900 text-zinc-500 hover:text-red-300 transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {g.members.map((m) => (
                <span key={m} className="px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300 text-[10px] font-mono">
                  {m}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-5 w-80 flex flex-col gap-3">
            <h2 className="font-semibold text-base">Add Group</h2>
            <label className="flex flex-col gap-1">
              <span className="text-zinc-400 text-xs">Name</span>
              <input
                autoFocus
                className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                placeholder="ALL_LIGHTS"
              />
            </label>
            <div className="flex flex-col gap-1">
              <span className="text-zinc-400 text-xs">Members (select pins)</span>
              <div className="bg-zinc-700 border border-zinc-600 rounded p-2 flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {pinNames.length === 0 && <span className="text-zinc-500 text-xs">No pins available</span>}
                {pinNames.map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => toggleMember(n)}
                    className={`px-1.5 py-0.5 rounded text-xs font-mono border ${
                      selected.includes(n)
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-zinc-800 border-zinc-600 text-zinc-300 hover:bg-zinc-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-xs">Cancel</button>
              <button type="button" onClick={handleAdd} disabled={!name.trim() || selected.length === 0} className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
