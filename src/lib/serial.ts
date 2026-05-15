import { invoke } from "@tauri-apps/api/core";
import type { PortInfo } from "../types/device";

export const listPorts = (): Promise<PortInfo[]> =>
  invoke("list_ports");

export const connectPort = (portName: string): Promise<void> =>
  invoke("connect", { portName });

export const disconnectPort = (): Promise<void> =>
  invoke("disconnect");

export const sendCommand = (command: string): Promise<string[]> =>
  invoke("send_command", { command });

export const startMonitor = (): Promise<void> =>
  invoke("start_monitor");
