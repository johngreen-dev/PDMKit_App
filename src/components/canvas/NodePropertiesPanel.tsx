import { RULE_PARAM_FIELDS, type ParamField } from "../../lib/nodeParams";
import type { RuleNodeData } from "./nodes/RuleNode";

interface Props {
  readonly nodeId: string;
  readonly data: RuleNodeData;
  readonly onParamChange: (nodeId: string, key: string, value: string) => void;
  readonly readOnly: boolean;
}

export function NodePropertiesPanel({ nodeId, data, onParamChange, readOnly }: Props) {
  const fields: ParamField[] = RULE_PARAM_FIELDS[data.ruleType] ?? [];
  const params = data.params ?? {};

  return (
    <div className="w-52 shrink-0 border-l border-zinc-700 overflow-y-auto p-3 flex flex-col gap-3">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-zinc-100 leading-snug">{data.label}</span>
          {readOnly && (
            <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400 border border-zinc-600">
              read-only
            </span>
          )}
        </div>
        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{data.ruleType}</div>
      </div>

      {/* Param fields */}
      <div className="flex flex-col gap-2">
        {fields.map((field) => {
          const currentValue = String(params[field.key] ?? field.default);
          const inputBase =
            "w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-400";
          const inputClass = readOnly
            ? `${inputBase} opacity-50 cursor-not-allowed`
            : inputBase;

          return (
            <div key={field.key} className="flex flex-col gap-0.5">
              <div className="flex items-baseline justify-between">
                <label className="text-[10px] text-zinc-400">{field.label}</label>
                {field.unit && (
                  <span className="text-[9px] text-zinc-500">{field.unit}</span>
                )}
              </div>
              {field.type === "hex" ? (
                <input
                  type="text"
                  className={`${inputClass} font-mono`}
                  value={currentValue}
                  placeholder={field.default}
                  disabled={readOnly}
                  onChange={(e) => onParamChange(nodeId, field.key, e.target.value)}
                />
              ) : (
                <input
                  type="number"
                  className={inputClass}
                  value={currentValue}
                  placeholder={field.default}
                  disabled={readOnly}
                  min={field.min}
                  max={field.max}
                  onChange={(e) => onParamChange(nodeId, field.key, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
