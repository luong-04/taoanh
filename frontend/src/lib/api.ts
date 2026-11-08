import { USState, Artwork, Mockup, CreativeConcept, DesignIdea, ProviderStatus } from "./types";
import { getStoredSettings, getProviderApiKey } from "./storage";

const API_BASE = "http://127.0.0.1:8000";

export async function fetchStates(): Promise<USState[]> {
  const res = await fetch(`${API_BASE}/api/states`);
  if (!res.ok) throw new Error("Failed to fetch US states");
  return res.json();
}

export async function fetchStateByCode(code: string): Promise<USState> {
  const res = await fetch(`${API_BASE}/api/states/${code}`);
  if (!res.ok) throw new Error(`Failed to fetch state ${code}`);
  return res.json();
}

export async function syncGoogleSheetsApi(sheetUrl: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/states/sync-sheet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sheet_url: sheetUrl })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to sync Google Sheets");
  }
  return res.json();
}

export async function suggestSlogans(
  stateCode: string,
  theme: string,
  audience?: string,
  variation?: number,
  niche?: string
): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/artwork/suggest-slogans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      state_code: stateCode,
      theme,
      niche,
      audience: audience || "All Veterans",
      variation: variation || 0
    })
  });
  if (!res.ok) throw new Error("Failed to suggest slogans");
  const data = await res.json();
  return data.slogans;
}

export async function fetchCreativeConcepts(
  stateCode: string,
  theme: string,
  audience?: string,
  designLayout?: string,
  variation?: number,
  niche?: string
): Promise<CreativeConcept[]> {
  const res = await fetch(`${API_BASE}/api/artwork/concepts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      state_code: stateCode,
      theme,
      niche,
      audience: audience || "All Veterans",
      design_layout: designLayout || "open_silhouette",
      variation: variation || 0
    })
  });
  if (!res.ok) throw new Error("Failed to fetch creative concepts");
  const data = await res.json();
  return data.concepts;
}

export async function fetchDesignIdeas(): Promise<DesignIdea[]> {
  const res = await fetch(`${API_BASE}/api/artwork/design-ideas`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.design_ideas || [];
}

export async function fetchProviderStatus(): Promise<ProviderStatus> {
  const res = await fetch(`${API_BASE}/api/artwork/provider-status`);
  if (!res.ok) return { available: false, message: "Server error" };
  return res.json();
}

export async function buildPromptPreview(params: {
  state_code: string;
  theme: string;
  niche?: string;
  design_style: string;
  slogan: string;
  product_color: string;
  audience?: string;
  product_type?: string;
  design_layout?: string;
  custom_notes?: string;
}): Promise<{ prompt: string; negative_prompt: string; suggested_title: string; concepts: CreativeConcept[]; state_context: any }> {
  const res = await fetch(`${API_BASE}/api/artwork/build-prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error("Failed to build prompt preview");
  return res.json();
}

export async function generateArtworkApi(params: {
  state_code: string;
  theme: string;
  niche?: string;
  design_style: string;
  slogan: string;
  product_color: string;
  audience?: string;
  product_type?: string;
  design_layout?: string;
  provider: string;
  custom_prompt?: string;
  custom_negative_prompt?: string;
  batch_size?: number;
}): Promise<{ artwork: Artwork; batch: Artwork[] }> {
  const settings = getStoredSettings();
  const apiKey = getProviderApiKey(params.provider, settings);

  const res = await fetch(`${API_BASE}/api/artwork/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-API-Key": apiKey } : {})
    },
    body: JSON.stringify({
      ...params,
      batch_size: params.batch_size || 1,
      api_key: apiKey
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Artwork generation failed (${res.status})`);
  }

  const data = await res.json();
  return { artwork: data.artwork, batch: data.batch || [data.artwork] };
}

export async function uploadCustomGarmentApi(file: File): Promise<{ success: boolean; garment_url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/mockup/upload-garment`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) throw new Error("Failed to upload custom garment");
  return res.json();
}

export async function extractArtworkFromMockupApi(formData: FormData): Promise<{
  success: boolean;
  artwork: Artwork;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/api/artwork/extract-from-mockup`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Artwork extraction failed (${res.status})`);
  }

  return res.json();
}

export async function analyzeUploadedMockupApi(formData: FormData): Promise<{
  success: boolean;
  uploaded_mockup_url: string;
  prompt: string;
  garment_color: string;
  scene_type: string;
  placement: string;
}> {
  const res = await fetch(`${API_BASE}/api/mockup/analyze-uploaded-mockup`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Mockup analysis failed (${res.status})`);
  }

  return res.json();
}

export async function fetchMockupPresets() {
  const res = await fetch(`${API_BASE}/api/mockup/presets`);
  if (!res.ok) throw new Error("Failed to fetch mockup presets");
  return res.json();
}

export async function generateMockupApi(params: {
  artwork_id: string;
  target_state: string;
  garment_color: string;
  mockup_type: string;
  lifestyle_scene: string;
  product_style?: string;
  print_placement?: string;
  model_gender: string;
  model_age: string;
  model_body_type?: string;
  model_ethnicity?: string;
  camera_style?: string;
  pose?: string;
  aspect_ratio: string;
  custom_garment_url?: string;
  uploaded_mockup_url?: string;
  custom_mockup_prompt?: string;
  provider: string;
  custom_x_pct?: number;
  custom_y_pct?: number;
  custom_scale?: number;
  custom_rotation?: number;
  blend_mode?: string;
  opacity?: number;
}): Promise<Mockup> {
  const settings = getStoredSettings();
  const apiKey = getProviderApiKey(params.provider, settings);

  const res = await fetch(`${API_BASE}/api/mockup/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-API-Key": apiKey } : {})
    },
    body: JSON.stringify({
      ...params,
      product_style: params.product_style || "flatlay_wood",
      print_placement: params.print_placement || "center_chest",
      model_body_type: params.model_body_type || "Athletic",
      model_ethnicity: params.model_ethnicity || "State AI Proposed",
      camera_style: params.camera_style || "Lifestyle",
      pose: params.pose || "Standing",
      blend_mode: params.blend_mode || "natural_dtg",
      opacity: params.opacity ?? 0.96,
      api_key: apiKey
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Mockup generation failed (${res.status})`);
  }

  const data = await res.json();
  return data.mockup;
}

export async function adjustMockupPlacementApi(params: {
  mockup_id: string;
  artwork_id?: string;
  x_pct: number;
  y_pct: number;
  scale: number;
  rotation: number;
  blend_mode?: string;
  opacity?: number;
}): Promise<Mockup> {
  const res = await fetch(`${API_BASE}/api/mockup/adjust-placement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...params,
      blend_mode: params.blend_mode || "natural_dtg",
      opacity: params.opacity ?? 0.96
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Repositioning failed (${res.status})`);
  }

  const data = await res.json();
  return data.mockup;
}

export async function fetchHistory(): Promise<{ artworks: Artwork[]; mockups: Mockup[] }> {
  const res = await fetch(`${API_BASE}/api/history`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function deleteHistoryItem(itemType: "artwork" | "mockup", id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/history/${itemType}/${id}`, {
    method: "DELETE"
  });
  return res.ok;
}

export async function exportBundleZip(artworkId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/history/export-bundle/${artworkId}`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to create export bundle");
  const data = await res.json();
  return data.download_url;
}

export async function verifyApiKey(provider: string, apiKey: string): Promise<{ valid: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/settings/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, api_key: apiKey })
  });
  if (!res.ok) throw new Error("Failed to verify key");
  return res.json();
}

export async function inspectDpiApi(formData: FormData): Promise<import("./types").DpiInspectionResult> {
  const res = await fetch(`${API_BASE}/api/dpi/inspect`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `DPI inspection failed (${res.status})`);
  }
  return res.json();
}

export async function upscaleDpiApi(formData: FormData): Promise<import("./types").DpiUpscaleResponse> {
  const res = await fetch(`${API_BASE}/api/dpi/upscale`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `300 DPI upscale failed (${res.status})`);
  }
  return res.json();
}
