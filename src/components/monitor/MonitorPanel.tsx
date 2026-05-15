import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { useDeviceStore } from "../../stores/deviceStore";

export function MonitorPanel() {
  const { log, appendLog, status } = useDeviceStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unlisten = listen<string>("monitor-line", (ev) => appendLog(ev.payload));
    return () => { unlisten.then((f) => f()); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-3 py-2 border-b border-zinc-700 shrink-0">
        <h2 className="font-semibold text-zinc-200 flex-1">Monitor</h2>
        <span className="text-zinc-500 text-xs">{status}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs text-zinc-300 bg-zinc-950">
        {log.map((line, i) => (
          <div key={i} className="leading-5">{line}</div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
