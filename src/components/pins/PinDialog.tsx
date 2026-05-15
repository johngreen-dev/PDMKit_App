import { useState } from "react";
import type { Pin, PinType, PullMode } from "../../types/config";
import { BOARD_GPIO_LABELS } from "../../types/config";
import { cn } from "../../lib/cn";

interface Props {
  onClose: () => void;
  onSave: (pin: Pin) => void;
}

const PIN_TYPES: { value: PinType; label: string }[] = [
  { value: "dout", label: "Digital Output" },
  { value: "din",  label: "Digital Input" },
  { value: "adc",  label: "ADC Input" },
  { value: "pwm",  label: "PWM Output" },
];

const GPIO_OPTIONS = BOARD_GPIO_LABELS.map((label, i) => ({
  label,
  value: i + 1, // IO_PIN_N maps to gpio N placeholder (real mapping on device)
}));

export function PinDialog({ onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<PinType>("dout");
  const [gpio, setGpio] = useState<string>("IO_PIN_1");
  const [pull, setPull] = useState<PullMode>("none");
  const [adcUnit, setAdcUnit] = useState(1);
  const [adcChannel, setAdcChannel] = useState(0);
  const [pwmFreq, setPwmFreq] = useState(5000);

  const handleSave = () => {
    if (!name.trim()) return;
    const pin: Pin = { name: name.trim(), type };
    if (type === "dout" || type === "din" || type === "pwm") {
      pin.gpio = gpio as unknown as number; // use label string — device resolves it
    }
    if (type === "din") pin.pull = pull;
    if (type === "adc") { pin.adcUnit = adcUnit; pin.adcChannel = adcChannel; }
    if (type === "pwm") pin.pwmFreq = pwmFreq;
    onSave(pin);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-5 w-80 flex flex-col gap-3">
        <h2 className="font-semibold text-base text-zinc-100">Add Pin</h2>

        {/* Name */}
        <label className="flex flex-col gap-1">
          <span className="text-zinc-400 text-xs">Name</span>
          <input
            autoFocus
            className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            placeholder="LED1"
          />
        </label>

        {/* Type */}
        <label className="flex flex-col gap-1">
          <span className="text-zinc-400 text-xs">Type</span>
          <select
            className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as PinType)}
          >
            {PIN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>

        {/* GPIO (dout / din / pwm) */}
        {(type === "dout" || type === "din" || type === "pwm") && (
          <label className="flex flex-col gap-1">
            <span className="text-zinc-400 text-xs">GPIO Pin</span>
            <select
              className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm"
              value={gpio}
              onChange={(e) => setGpio(e.target.value)}
            >
              {GPIO_OPTIONS.map((o) => (
                <option key={o.label} value={o.label}>{o.label}</option>
              ))}
            </select>
          </label>
        )}

        {/* Pull mode (din only) */}
        {type === "din" && (
          <label className="flex flex-col gap-1">
            <span className="text-zinc-400 text-xs">Pull Mode</span>
            <div className="flex gap-2">
              {(["up", "down", "none"] as PullMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setPull(m)}
                  className={cn(
                    "flex-1 py-1 rounded text-xs border",
                    pull === m
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </label>
        )}

        {/* ADC (adc only) */}
        {type === "adc" && (
          <div className="flex gap-2">
            <label className="flex flex-col gap-1 flex-1">
              <span className="text-zinc-400 text-xs">ADC Unit</span>
              <select
                className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm"
                value={adcUnit}
                onChange={(e) => setAdcUnit(+e.target.value)}
              >
                <option value={1}>Unit 1</option>
                <option value={2}>Unit 2</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 flex-1">
              <span className="text-zinc-400 text-xs">Channel</span>
              <input
                type="number"
                min={0}
                max={9}
                className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm"
                value={adcChannel}
                onChange={(e) => setAdcChannel(+e.target.value)}
              />
            </label>
          </div>
        )}

        {/* PWM freq */}
        {type === "pwm" && (
          <label className="flex flex-col gap-1">
            <span className="text-zinc-400 text-xs">Frequency (Hz)</span>
            <input
              type="number"
              min={1}
              max={50000}
              className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm"
              value={pwmFreq}
              onChange={(e) => setPwmFreq(+e.target.value)}
            />
          </label>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
