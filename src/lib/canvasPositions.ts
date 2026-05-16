const KEY = "pdmkit_canvas_positions";

export type PositionMap = Record<string, { x: number; y: number }>;

export function loadPositions(): PositionMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as PositionMap;
  } catch {
    return {};
  }
}

export function persistPositions(nodes: { id: string; position: { x: number; y: number } }[]): void {
  const current = loadPositions();
  for (const { id, position } of nodes) {
    current[id] = position;
  }
  localStorage.setItem(KEY, JSON.stringify(current));
}
