/**
 * Settings Store — reading mode, font size, highlights, sound, motion.
 */

import { create } from 'zustand';
import type { UserSettings } from '@models';
import { DefaultSettings } from '@models';
import * as db from '@services/database';

interface SettingsStore {
  settings: UserSettings;
  isLoaded: boolean;
  load: () => Promise<void>;
  update: (partial: Partial<UserSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DefaultSettings,
  isLoaded: false,

  load: async () => {
    const settings = await db.getSettings();
    set({ settings, isLoaded: true });
  },

  update: async (partial) => {
    const next = { ...get().settings, ...partial };
    await db.saveSettings(next);
    set({ settings: next });
  },
}));
