export type PinType = "dout" | "din" | "adc" | "pwm";
export type PullMode = "up" | "down" | "none";

export interface Pin {
  name: string;
  type: PinType;
  gpio?: number;      // dout, din, pwm
  pull?: PullMode;    // din
  adcUnit?: number;   // adc (1 or 2)
  adcChannel?: number;// adc
  pwmFreq?: number;   // pwm (Hz)
}

export interface Group {
  name: string;
  members: string[];
}

export interface Variable {
  name: string;
  expr: string;
}

export type RuleCategory =
  | "expression"
  | "combinational"
  | "timing"
  | "oscillator"
  | "threshold"
  | "stateful"
  | "protective"
  | "can_rx"
  | "can_tx";

export interface Rule {
  index: number;
  type: string;
  src?: string;
  src2?: string;
  srcs?: string[];
  dst?: string;
  expr?: string;
  // timing params (ms)
  on?: number;
  off?: number;
  delay?: number;
  window?: number;
  // generic params
  pa?: number;
  pb?: number;
  // thresholds
  tlo?: number;
  thi?: number;
  olo?: number;
  ohi?: number;
  inv?: boolean;
  // CAN fields
  cid?: number;
  cby?: number;
  cbi?: number;
  cln?: number;
  cxt?: boolean;
  // raw display (from RS_ListRules)
  raw?: string;
}

// Board GPIO labels (IO_PIN_1 ... IO_PIN_21)
export const BOARD_GPIO_LABELS = Array.from({ length: 21 }, (_, i) => `IO_PIN_${i + 1}`);
export const BOARD_ADC_LABELS = Array.from({ length: 5 }, (_, i) => `ADC_PIN_${i + 1}`);
