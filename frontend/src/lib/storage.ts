import { BYOKSettings } from "./types";

const STORAGE_KEY = "pod_studio_byok_settings_v1";

export const DEFAULT_SETTINGS: BYOKSettings = {
  falKey: "",
  replicateKey: "",
  geminiKey: "",
  openaiKey: "",
  fashnKey: "",
  defaultImageProvider: "local_demo",
  defaultMockupProvider: "local_compositor"
};

export function getStoredSettings(): BYOKSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Failed to read settings from localStorage", e);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: Partial<BYOKSettings>): BYOKSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }
  try {
    const current = getStoredSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to save settings to localStorage", e);
    return DEFAULT_SETTINGS;
  }
}

export function getProviderApiKey(provider: string, settings: BYOKSettings): string {
  switch (provider) {
    case "fal":
    case "fal_vton":
      return settings.falKey;
    case "replicate":
    case "replicate_inpaint":
      return settings.replicateKey;
    case "gemini":
      return settings.geminiKey;
    case "openai":
      return settings.openaiKey;
    case "fashn":
      return settings.fashnKey;
    default:
      return "";
  }
}

