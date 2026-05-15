import { InputNode } from "./InputNode";
import { OutputNode } from "./OutputNode";
import { RuleNode } from "./RuleNode";
import { GroupNode } from "./GroupNode";

export const nodeTypes = {
  input_pin: InputNode,
  output_pin: OutputNode,
  rule: RuleNode,
  group: GroupNode,
};
