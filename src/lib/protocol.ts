import { sendCommand } from "./serial";
import type { Pin, Group, Variable, Rule } from "../types/config";

// ── Session ────────────────────────────────────────────────────────────────

export const startSetup = () => sendCommand("RS_StartSetup");
export const saveSetup = () => sendCommand("RS_SaveSetup");
export const cancelSetup = () => sendCommand("RS_CancelSetup");

// ── Pins ───────────────────────────────────────────────────────────────────

export const listPins = () => sendCommand("RS_ListPins");
export const removePin = (name: string) => sendCommand(`RS_RemovePin ${name}`);

export const addPin = (pin: Pin): Promise<string[]> => {
  switch (pin.type) {
    case "dout":
      return sendCommand(`RS_AddOutput ${pin.name} ${pin.gpio}`);
    case "din":
      return sendCommand(`RS_AddInput ${pin.name} ${pin.gpio} ${pin.pull ?? "none"}`);
    case "adc":
      return sendCommand(`RS_AddADC ${pin.name} ${pin.adcUnit} ${pin.adcChannel}`);
    case "pwm": {
      const freq = pin.pwmFreq ? " " + String(pin.pwmFreq) : "";
      return sendCommand(`RS_AddPWM ${pin.name} ${pin.gpio}${freq}`);
    }
  }
};

const parseGpio = (s: string): number => {
  const m = /gpio(\d+)/i.exec(s);
  return m ? +m[1] : 0;
};

function parsePinLine(parts: string[]): Pin | null {
  const [name, type, loc] = parts;
  if (type === "dout") return { name, type: "dout", gpio: parseGpio(loc) };
  if (type === "din")  return { name, type: "din",  gpio: parseGpio(loc), pull: (parts[3] ?? "none") as Pin["pull"] };
  if (type === "adc") {
    const m = /u(\d)c(\d+)/.exec(loc);
    return m ? { name, type: "adc", adcUnit: +m[1], adcChannel: +m[2] } : null;
  }
  if (type === "pwm") {
    const freqStr = parts[3];
    return { name, type: "pwm", gpio: parseGpio(loc), pwmFreq: freqStr ? Number.parseInt(freqStr, 10) : 5000 };
  }
  return null;
}

export const parsePins = (lines: string[]): Pin[] => {
  const pins: Pin[] = [];
  for (const line of lines) {
    if (line === "PINS_BEGIN" || line === "PINS_END") continue;
    const parts = line.split(":");
    if (parts.length < 3) continue;
    const pin = parsePinLine(parts);
    if (pin) pins.push(pin);
  }
  return pins;
};

// ── Storage ────────────────────────────────────────────────────────────────

export const getStorage = () => sendCommand("RS_GetStorage");

function nvsStr(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function nvsNum(v: unknown): number | undefined {
  return v === undefined ? undefined : Number(v);
}

function parseNvsRule(r: Record<string, unknown>, i: number): Rule {
  const rule: Rule = {
    index: i,
    type: typeof r.t === "string" ? r.t : "unknown",
    raw:  JSON.stringify(r),
  };
  rule.src  = nvsStr(r.src);
  rule.src2 = nvsStr(r.src2);
  rule.dst  = nvsStr(r.dst);
  rule.expr = nvsStr(r.expr);
  if (Array.isArray(r.srcs)) rule.srcs = r.srcs.filter((s): s is string => typeof s === "string");
  rule.on     = nvsNum(r.on);
  rule.off    = nvsNum(r.off);
  rule.delay  = nvsNum(r.delay);
  rule.window = nvsNum(r.window);
  rule.pa     = nvsNum(r.pa);
  rule.pb     = nvsNum(r.pb);
  rule.tlo    = nvsNum(r.tlo);
  rule.thi    = nvsNum(r.thi);
  rule.olo    = nvsNum(r.olo);
  rule.ohi    = nvsNum(r.ohi);
  rule.cid    = nvsNum(r.cid);
  rule.cby    = nvsNum(r.cby);
  rule.cbi    = nvsNum(r.cbi);
  rule.cln    = nvsNum(r.cln);
  if (r.inv !== undefined) rule.inv = Boolean(r.inv);
  if (r.cxt !== undefined) rule.cxt = Boolean(r.cxt);
  return rule;
}

/** Parse RS_GetStorage response and extract fully-populated Rule objects from the NVS JSON. */
export function parseStorageRules(lines: string[]): Rule[] | null {
  const configLine = lines.find((l) => l.startsWith("io_config:str:"));
  if (!configLine) return null;
  try {
    const obj = JSON.parse(configLine.slice("io_config:str:".length)) as Record<string, unknown>;
    if (!Array.isArray(obj.rules)) return null;
    return (obj.rules as Record<string, unknown>[]).map((r, i) => parseNvsRule(r, i));
  } catch {
    return null;
  }
}

// ── Rules ──────────────────────────────────────────────────────────────────

export const listRules = () => sendCommand("RS_ListRules");
export const removeRule = (index: number) => sendCommand(`RS_RemoveRule ${index}`);

// Format: <index>:<type>:<src1 [src2...]>-><dst>
// Returns a partially-filled Rule from the portion after the index colon.
function parseRuleLine(rest: string, index: number): Rule {
  const rule: Rule = { index, type: "unknown", raw: rest };
  const arrowIdx = rest.indexOf("->");

  if (arrowIdx === -1) {
    rule.type = rest.split(":")[0] ?? "unknown";
    return rule;
  }

  const beforeArrow = rest.slice(0, arrowIdx);  // "type:src1 src2"
  const afterArrow  = rest.slice(arrowIdx + 2); // "dst"
  const secondColon = beforeArrow.indexOf(":");

  if (secondColon === -1) {
    rule.type = beforeArrow.trim();
  } else {
    rule.type = beforeArrow.slice(0, secondColon);
    const srcNames = beforeArrow.slice(secondColon + 1).trim().split(/\s+/).filter(Boolean);
    rule.src  = srcNames[0];
    rule.src2 = srcNames[1];
    if (srcNames.length > 2) rule.srcs = srcNames;
  }

  rule.dst = afterArrow.trim() || undefined;
  return rule;
}

export const parseRules = (lines: string[]): Rule[] => {
  const rules: Rule[] = [];
  let i = 0;
  for (const line of lines) {
    if (line === "RULES_BEGIN" || line === "RULES_END") continue;
    const firstColon = line.indexOf(":");
    if (firstColon === -1) continue;
    rules.push(parseRuleLine(line.slice(firstColon + 1), i++));
  }
  return rules;
};

// ── Variables ──────────────────────────────────────────────────────────────

export const listVars = () => sendCommand("RS_ListVars");
export const addVar = (v: Variable) => sendCommand(`RS_AddVar ${v.name} ${v.expr}`);
export const removeVar = (name: string) => sendCommand(`RS_RemoveVar ${name}`);

export const parseVars = (lines: string[]): Variable[] => {
  const vars: Variable[] = [];
  for (const line of lines) {
    if (line === "VARS_BEGIN" || line === "VARS_END") continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    vars.push({ name: line.slice(0, idx), expr: line.slice(idx + 1) });
  }
  return vars;
};

// ── Groups ─────────────────────────────────────────────────────────────────

export const listGroups = () => sendCommand("RS_ListGroups");
export const addGroup = (g: Group) => sendCommand(`RS_AddGroup ${g.name} ${g.members.join(" ")}`);
export const removeGroup = (name: string) => sendCommand(`RS_RemoveGroup ${name}`);

export const parseGroups = (lines: string[]): Group[] => {
  const groups: Group[] = [];
  for (const line of lines) {
    if (line === "GROUPS_BEGIN" || line === "GROUPS_END") continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    groups.push({ name: line.slice(0, idx), members: line.slice(idx + 1).split(",") });
  }
  return groups;
};

// ── I/O ────────────────────────────────────────────────────────────────────

export const setOutput = (name: string, value: 0 | 1) =>
  sendCommand(`RS_SetOutput ${name} ${value}`);

export const getInput = (name: string) =>
  sendCommand(`RS_GetInput ${name}`);
