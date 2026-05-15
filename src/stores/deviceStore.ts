import { create } from "zustand";
import type { PortInfo, ConnectionStatus } from "../types/device";
import { listPorts, connectPort, disconnectPort } from "../lib/serial";

interface DeviceStore {
  ports: PortInfo[];
  selectedPort: string;
  status: ConnectionStatus;
  inSetup: boolean;
  log: string[];

  refreshPorts: () => Promise<void>;
  selectPort: (name: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setInSetup: (v: boolean) => void;
  appendLog: (line: string) => void;
}

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  ports: [],
  selectedPort: "",
  status: "disconnected",
  inSetup: false,
  log: [],

  refreshPorts: async () => {
    const ports = await listPorts();
    set({ ports });
    // Auto-select PDMKit device if found and nothing selected
    if (!get().selectedPort) {
      const pdm = ports.find((p) => p.is_pdmkit);
      if (pdm) set({ selectedPort: pdm.name });
    }
  },

  selectPort: (name) => set({ selectedPort: name }),

  connect: async () => {
    const { selectedPort } = get();
    if (!selectedPort) return;
    set({ status: "connecting" });
    try {
      await connectPort(selectedPort);
      set({ status: "connected" });
    } catch (e) {
      set({ status: "disconnected" });
      throw e;
    }
  },

  disconnect: async () => {
    await disconnectPort();
    set({ status: "disconnected", inSetup: false });
  },

  setInSetup: (v) => set({ inSetup: v }),
  appendLog: (line) => set((s) => ({ log: [...s.log.slice(-500), line] })),
}));
