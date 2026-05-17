import { useEffect } from "react";
import { RefreshCw, Plug, PlugZap, Save, X } from "lucide-react";
import { useDeviceStore } from "../../stores/deviceStore";
import { useConfigStore } from "../../stores/configStore";
import { useCanvasStore } from "../../stores/canvasStore";
import { startSetup, saveSetup, cancelSetup, removeRule } from "../../lib/protocol";
import { sendCommand } from "../../lib/serial";
import { buildRuleCommands } from "../../lib/canvasToRules";
import { cn } from "../../lib/cn";

export function ConnectionBar() {
  const {
    ports, selectedPort, status, inSetup,
    refreshPorts, selectPort, connect, disconnect, setInSetup, appendLog,
  } = useDeviceStore();
  const { loadAll, rules } = useConfigStore();
  const { nodes, edges } = useCanvasStore();

  useEffect(() => { refreshPorts(); }, []);

  const handleConnect = async () => {
    try {
      await connect();
      await loadAll();
    } catch (e) {
      appendLog(`ERR: ${e}`);
    }
  };

  const handleDisconnect = async () => {
    if (inSetup) await handleCancel();
    await disconnect();
  };

  const handleStartSetup = async () => {
    const lines = await startSetup();
    appendLog(lines.join(" "));
    setInSetup(true);
    // Do NOT call loadAll() here — RS_GetStorage is unreliable in setup mode and
    // would overwrite correctly-loaded CAN params with param-less fallback data.
    // The initial connect already loaded everything we need.
  };

  const handleSave = async () => {
    try {
      // 1. Remove all existing rules (highest index first to avoid re-indexing)
      for (let i = rules.length - 1; i >= 0; i--) {
        const res = await removeRule(i);
        appendLog(res.join(" "));
      }

      // 2. Add rules derived from canvas
      const cmds = buildRuleCommands(nodes, edges);
      appendLog(`Canvas → ${cmds.length} rule(s)`);
      for (const cmd of cmds) {
        const res = await sendCommand(cmd);
        appendLog(`${cmd}  →  ${res.join(" ")}`);
      }

      // 3. Persist to NVS
      const lines = await saveSetup();
      appendLog(lines.join(" "));
      setInSetup(false);
      await loadAll();
    } catch (e) {
      appendLog(`ERR save: ${e}`);
    }
  };

  const handleCancel = async () => {
    const lines = await cancelSetup();
    appendLog(lines.join(" "));
    setInSetup(false);
    await loadAll();
  };

  const connected = status === "connected";

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border-b border-zinc-700 shrink-0">
      <span className="font-bold text-blue-400 mr-2 tracking-wide">PDMKit</span>

      <select
        title="Serial port"
        className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-xs w-40 disabled:opacity-50"
        value={selectedPort}
        onChange={(e) => selectPort(e.target.value)}
        disabled={connected}
      >
        <option value="">— select port —</option>
        {ports.map((p) => (
          <option key={p.name} value={p.name}>
            {p.is_pdmkit ? "★ " : ""}{p.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={refreshPorts}
        disabled={connected}
        className="p-1 rounded hover:bg-zinc-600 disabled:opacity-40"
        title="Refresh ports"
      >
        <RefreshCw size={14} />
      </button>

      {!connected ? (
        <button
          type="button"
          onClick={handleConnect}
          disabled={!selectedPort || status === "connecting"}
          className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs"
        >
          <Plug size={13} /> Connect
        </button>
      ) : (
        <button
          type="button"
          onClick={handleDisconnect}
          className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-600 hover:bg-zinc-500 text-xs"
        >
          <PlugZap size={13} /> Disconnect
        </button>
      )}

      <span
        className={cn(
          "px-2 py-0.5 rounded-full text-xs font-medium",
          status === "connected" && !inSetup && "bg-green-800 text-green-300",
          status === "connected" && inSetup && "bg-amber-700 text-amber-200",
          status === "connecting" && "bg-zinc-600 text-zinc-300",
          status === "disconnected" && "bg-zinc-700 text-zinc-400",
        )}
      >
        {status === "connected" && inSetup ? "Setup Mode" : status}
      </span>

      <div className="flex-1" />

      {connected && !inSetup && (
        <button
          type="button"
          onClick={handleStartSetup}
          className="flex items-center gap-1 px-2 py-1 rounded bg-amber-700 hover:bg-amber-600 text-xs"
        >
          Edit Config
        </button>
      )}
      {connected && inSetup && (
        <>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1 px-2 py-1 rounded bg-green-700 hover:bg-green-600 text-xs"
          >
            <Save size={13} /> Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1 px-2 py-1 rounded bg-red-800 hover:bg-red-700 text-xs"
          >
            <X size={13} /> Cancel
          </button>
        </>
      )}
    </div>
  );
}
