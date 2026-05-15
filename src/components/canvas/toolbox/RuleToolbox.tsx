export interface ToolboxItem {
  ruleType: string;
  label: string;
  category: string;
}

const TOOLBOX_ITEMS: ToolboxItem[] = [
  // Combinational
  { ruleType: "direct",   label: "Direct",   category: "combinational" },
  { ruleType: "and",      label: "AND",       category: "combinational" },
  { ruleType: "or",       label: "OR",        category: "combinational" },
  { ruleType: "not",      label: "NOT",       category: "combinational" },
  { ruleType: "xor",      label: "XOR",       category: "combinational" },
  // Timing
  { ruleType: "on_delay",  label: "On Delay",  category: "timing" },
  { ruleType: "off_delay", label: "Off Delay", category: "timing" },
  { ruleType: "min_on",    label: "Min On",    category: "timing" },
  { ruleType: "one_shot",  label: "One Shot",  category: "timing" },
  { ruleType: "debounce",  label: "Debounce",  category: "timing" },
  // Oscillator
  { ruleType: "flasher",  label: "Flasher",   category: "oscillator" },
  { ruleType: "hazard",   label: "Hazard",    category: "oscillator" },
  { ruleType: "burst",    label: "Burst",     category: "oscillator" },
  { ruleType: "pwm_out",  label: "PWM Out",   category: "oscillator" },
  // Threshold
  { ruleType: "threshold",  label: "Threshold",  category: "threshold" },
  { ruleType: "hysteresis", label: "Hysteresis", category: "threshold" },
  { ruleType: "window",     label: "Window",     category: "threshold" },
  { ruleType: "adc_map",    label: "ADC Map",    category: "threshold" },
  // Stateful
  { ruleType: "sr_latch",   label: "SR Latch",   category: "stateful" },
  { ruleType: "toggle",     label: "Toggle",     category: "stateful" },
  { ruleType: "interlock",  label: "Interlock",  category: "stateful" },
  { ruleType: "prio_or",    label: "Priority OR",category: "stateful" },
  { ruleType: "n_press",    label: "N Press",    category: "stateful" },
  // Protective
  { ruleType: "oc_latch",   label: "OC Latch",   category: "protective" },
  { ruleType: "retry",      label: "Retry",      category: "protective" },
  { ruleType: "watchdog",   label: "Watchdog",   category: "protective" },
  // CAN RX
  { ruleType: "can_sig",     label: "CAN Signal",  category: "can_rx" },
  { ruleType: "can_thr",     label: "CAN Thresh",  category: "can_rx" },
  { ruleType: "can_map",     label: "CAN Map",     category: "can_rx" },
  { ruleType: "can_timeout", label: "CAN Timeout", category: "can_rx" },
  { ruleType: "can_hrx",     label: "CAN HB RX",   category: "can_rx" },
  // CAN TX
  { ruleType: "can_tx_st",  label: "CAN TX GPIO", category: "can_tx" },
  { ruleType: "can_tx_an",  label: "CAN TX ADC",  category: "can_tx" },
  { ruleType: "can_htx",    label: "CAN HB TX",   category: "can_tx" },
];

const CATEGORY_HEADER_COLORS: Record<string, string> = {
  combinational: "text-purple-400",
  timing:        "text-amber-400",
  oscillator:    "text-pink-400",
  threshold:     "text-orange-400",
  stateful:      "text-cyan-400",
  protective:    "text-red-400",
  can_rx:        "text-teal-400",
  can_tx:        "text-sky-400",
};

const CATEGORY_PILL_COLORS: Record<string, string> = {
  combinational: "bg-purple-900 border-purple-700 text-purple-200 hover:bg-purple-700",
  timing:        "bg-amber-900 border-amber-700 text-amber-200 hover:bg-amber-700",
  oscillator:    "bg-pink-900 border-pink-700 text-pink-200 hover:bg-pink-700",
  threshold:     "bg-orange-900 border-orange-700 text-orange-200 hover:bg-orange-700",
  stateful:      "bg-cyan-900 border-cyan-700 text-cyan-200 hover:bg-cyan-700",
  protective:    "bg-red-900 border-red-800 text-red-200 hover:bg-red-700",
  can_rx:        "bg-teal-900 border-teal-700 text-teal-200 hover:bg-teal-700",
  can_tx:        "bg-sky-900 border-sky-700 text-sky-200 hover:bg-sky-700",
};

const grouped = TOOLBOX_ITEMS.reduce<Record<string, ToolboxItem[]>>((acc, item) => {
  acc[item.category] ??= [];
  acc[item.category].push(item);
  return acc;
}, {});

interface Props {
  onAdd: (item: ToolboxItem) => void;
}

export function RuleToolbox({ onAdd }: Props) {
  return (
    <div className="w-44 shrink-0 border-l border-zinc-700 overflow-y-auto p-2 flex flex-col gap-3">
      <div className="text-zinc-400 text-[10px] uppercase tracking-wide font-semibold px-1">
        Rule Blocks
        <span className="block text-zinc-600 normal-case tracking-normal font-normal mt-0.5">
          Click to add
        </span>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="flex flex-col gap-1">
          <div className={`text-[9px] uppercase tracking-widest font-bold px-1 ${CATEGORY_HEADER_COLORS[cat] ?? "text-zinc-400"}`}>
            {cat.replace("_", " ")}
          </div>
          {items.map((item) => (
            <button
              key={item.ruleType}
              type="button"
              onClick={() => onAdd(item)}
              title={`Add ${item.label}`}
              className={`px-2 py-1.5 rounded border text-xs text-left cursor-pointer select-none transition-colors ${CATEGORY_PILL_COLORS[cat] ?? "bg-zinc-800 border-zinc-600 text-zinc-300"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
