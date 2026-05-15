export interface PortInfo {
  name: string;
  is_pdmkit: boolean;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "setup";
