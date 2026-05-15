import { useState } from "react";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { useConfigStore } from "../../stores/configStore";
import { useDeviceStore } from "../../stores/deviceStore";
import { PinDialog } from "./PinDialog";
import type { Pin } from "../../types/config";
import { cn } from "../../lib/cn";

const TYPE_COLORS: Record<string, string> = {
  dout: "bg-blue-900 text-blue-300",
  din:  "bg-green-900 text-green-300",
  adc:  "bg-purple-900 text-purple-300",
  pwm:  "bg-amber-900 text-amber-300",
};

const TYPE_LABELS: Record<string, string> = {
  dout: "OUT",
  din:  "IN",
  adc:  "ADC",
  pwm:  "PWM",
};

function pinDetail(pin: Pin): string {
  if (pin.type === "dout" || pin.type === "din" || pin.type === "pwm")
    return `gpio${pin.gpio}${pin.type === "din" ? ` (${pin.pull})` : ""}${pin.type === "pwm" ? ` ${pin.pwmFreq}Hz` : ""}`;
  if (pin.type === "adc")
    return `u${pin.adcUnit}c${pin.adcChannel}`;
  return "";
}

export function PinsPanel() {
  const { pins, addPin, removePin, loadPins } = useConfigStore();
  const { inSetup, appendLog } = useDeviceStore();
  const [showDialog, setShowDialog] = useState(false);

  const handleAdd = async (pin: Pin) => {
    try {
      await addPin(pin);
      setShowDialog(false);
    } catch (e) {
      appendLog(`ERR AddPin: ${e}`);
    }
  };

  const handleRemove = async (name: string) => {
    try {
      await removePin(name);
    } catch (e) {
      appendLog(`ERR RemovePin: ${e}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700 shrink-0">
        <h2 className="font-semibold text-zinc-200 flex-1">Pins</h2>
        <button
          onClick={loadPins}
          className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
        <button
          onClick={() => setShowDialog(true)}
          disabled={!inSetup}
          className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs"
          title={!inSetup ? "Enter setup mode to edit" : "Add pin"}
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Pin list */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {pins.length === 0 && (
          <div className="text-zinc-500 text-xs text-center mt-8">
            No pins configured
          </div>
        )}
        {pins.map((pin) => (
          <div
            key={pin.name}
            className="flex items-center gap-2 px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-750 group"
          >
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-bold w-9 text-center",
                TYPE_COLORS[pin.type],
              )}
            >
              {TYPE_LABELS[pin.type]}
            </span>
            <span className="font-mono font-semibold text-zinc-100 flex-1">{pin.name}</span>
            <span className="text-zinc-500 text-xs font-mono">{pinDetail(pin)}</span>
            {inSetup && (
              <button
                onClick={() => handleRemove(pin.name)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-900 text-zinc-500 hover:text-red-300 transition-opacity"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {showDialog && (
        <PinDialog onClose={() => setShowDialog(false)} onSave={handleAdd} />
      )}
    </div>
  );
}
