export interface ParamField {
  key: string;
  label: string;
  type: "number" | "hex";
  unit?: string;
  default: string;
  min?: number;
  max?: number;
}

const n = (key: string, label: string, unit?: string, def = "0", min?: number, max?: number): ParamField =>
  ({ key, label, type: "number", unit, default: def, min, max });

const h = (key: string, label: string, def = "0x100"): ParamField =>
  ({ key, label, type: "hex", default: def });

export const RULE_PARAM_FIELDS: Record<string, ParamField[]> = {
  // Timing
  on_delay:  [n("delay", "Delay",          "ms", "100")],
  off_delay: [n("delay", "Delay",          "ms", "100")],
  min_on:    [n("delay", "Min on-time",    "ms", "100")],
  one_shot:  [n("delay", "Pulse width",    "ms", "100")],
  debounce:  [n("delay", "Stable window",  "ms", "20")],
  // Oscillator
  flasher:   [n("on", "On time", "ms", "500"), n("off", "Off time", "ms", "500")],
  hazard:    [n("on", "On time", "ms", "500"), n("off", "Off time", "ms", "500")],
  burst:     [n("on", "Pulse on", "ms", "100"), n("off", "Pulse off", "ms", "100"), n("count", "Count", undefined, "3", 1)],
  pwm_out:   [n("freq", "Frequency", "Hz", "1000", 1), n("duty", "Duty cycle", "%", "50", 0, 100)],
  // Threshold
  threshold:  [n("thi", "Threshold",     "mV", "2500"), n("tlo", "Hysteresis low", "mV", "1500")],
  hysteresis: [n("tlo", "Low threshold", "mV", "1500"), n("thi", "High threshold", "mV", "2500")],
  window:     [n("tlo", "Low",           "mV", "1000"), n("thi", "High",           "mV", "3000")],
  adc_map:    [n("tlo", "Input low",  "mV", "0"), n("thi", "Input high", "mV", "3300"),
               n("olo", "Output low", "%",  "0"), n("ohi", "Output high", "%",   "100")],
  // Protective / stateful
  watchdog:  [n("window", "Timeout",       "ms", "5000")],
  oc_latch:  [n("delay",  "Confirm delay", "ms", "1000")],
  retry:     [n("delay",  "Backoff",       "ms", "1000")],
  // CAN RX
  can_sig: [
    h("cid", "CAN ID"),
    n("cby", "Byte offset",  undefined, "0",   0,  7),
    n("cbi", "Bit offset",   undefined, "0",   0,  7),
    n("cln", "Bit length",   undefined, "8",   1, 64),
    n("tlo", "Threshold",    undefined, "128"),
  ],
  can_thr: [
    h("cid", "CAN ID"),
    n("cby", "Byte offset",    undefined, "0",   0,  7),
    n("cbi", "Bit offset",     undefined, "0",   0,  7),
    n("cln", "Bit length",     undefined, "8",   1, 64),
    n("tlo", "Low threshold",  undefined, "100"),
    n("thi", "High threshold", undefined, "200"),
  ],
  can_map: [
    h("cid", "CAN ID"),
    n("cby", "Byte offset", undefined, "0",   0,  7),
    n("cbi", "Bit offset",  undefined, "0",   0,  7),
    n("cln", "Bit length",  undefined, "8",   1, 64),
    n("tlo", "Input low",   undefined, "0"),
    n("thi", "Input high",  undefined, "255"),
    n("olo", "Output low",  "%",       "0"),
    n("ohi", "Output high", "%",       "100"),
  ],
  can_timeout: [
    h("cid",    "CAN ID"),
    n("window", "Timeout", "ms", "1000"),
  ],
  can_hrx: [
    h("cid",    "CAN ID"),
    n("window", "Timeout", "ms", "1000"),
  ],
  can_cmd_out: [
    h("cid", "CAN ID"),
    n("cby", "Byte offset",   undefined, "0", 0, 7),
    n("tlo", "Command value", undefined, "1"),
  ],
  can_tx_st: [
    h("cid", "CAN ID", "0x200"),
    n("interval", "TX interval", "ms", "100"),
  ],
  can_tx_an: [
    h("cid", "CAN ID", "0x200"),
    n("cby",      "Byte offset",  undefined, "0", 0, 7),
    n("interval", "TX interval",  "ms",      "100"),
  ],
  can_htx: [
    h("cid", "CAN ID", "0x200"),
    n("interval", "TX interval", "ms", "1000"),
  ],
};
