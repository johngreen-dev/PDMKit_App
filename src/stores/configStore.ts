import { create } from "zustand";
import type { Pin, Group, Variable, Rule } from "../types/config";
import * as proto from "../lib/protocol";

interface ConfigStore {
  pins: Pin[];
  groups: Group[];
  variables: Variable[];
  rules: Rule[];
  loading: boolean;

  loadAll: () => Promise<void>;
  loadPins: () => Promise<void>;
  loadGroups: () => Promise<void>;
  loadVars: () => Promise<void>;
  loadRules: () => Promise<void>;

  addPin: (pin: Pin) => Promise<void>;
  removePin: (name: string) => Promise<void>;

  addGroup: (group: Group) => Promise<void>;
  removeGroup: (name: string) => Promise<void>;

  addVar: (variable: Variable) => Promise<void>;
  removeVar: (name: string) => Promise<void>;

  removeRule: (index: number) => Promise<void>;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  pins: [],
  groups: [],
  variables: [],
  rules: [],
  loading: false,

  loadAll: async () => {
    set({ loading: true });
    await Promise.all([
      useConfigStore.getState().loadPins(),
      useConfigStore.getState().loadGroups(),
      useConfigStore.getState().loadVars(),
      useConfigStore.getState().loadRules(),
    ]);
    set({ loading: false });
  },

  loadPins: async () => {
    const lines = await proto.listPins();
    set({ pins: proto.parsePins(lines) });
  },

  loadGroups: async () => {
    const lines = await proto.listGroups();
    set({ groups: proto.parseGroups(lines) });
  },

  loadVars: async () => {
    const lines = await proto.listVars();
    set({ variables: proto.parseVars(lines) });
  },

  loadRules: async () => {
    const lines = await proto.listRules();
    set({ rules: proto.parseRules(lines) });
  },

  addPin: async (pin) => {
    await proto.addPin(pin);
    await useConfigStore.getState().loadPins();
  },

  removePin: async (name) => {
    await proto.removePin(name);
    await useConfigStore.getState().loadPins();
  },

  addGroup: async (group) => {
    await proto.addGroup(group);
    await useConfigStore.getState().loadGroups();
  },

  removeGroup: async (name) => {
    await proto.removeGroup(name);
    await useConfigStore.getState().loadGroups();
  },

  addVar: async (variable) => {
    await proto.addVar(variable);
    await useConfigStore.getState().loadVars();
  },

  removeVar: async (name) => {
    await proto.removeVar(name);
    await useConfigStore.getState().loadVars();
  },

  removeRule: async (index) => {
    await proto.removeRule(index);
    await useConfigStore.getState().loadRules();
  },
}));
