export interface AgeDistribution {
  under_18: number;
  "18_24": number;
  "25_34": number;
  "35_44": number;
  "45_54": number;
  "55_64": number;
  "65_plus": number;
}

export interface Demographics {
  population: number;
  median_age: number;
  gender: {
    male: number;
    female: number;
  };
  race_ethnicity: {
    white: number;
    black: number;
    hispanic: number;
    asian: number;
    native_american: number;
    pacific_islander?: number;
    other: number;
    multiracial?: number;
  };
  age_distribution?: AgeDistribution;
  veteran_population: number;
  veteran_percentage: number;
}

export interface ReligionValues {
  christian_pct: number;
  evangelical_pct: number;
  catholic_pct: number;
  mainline_protestant_pct: number;
  unaffiliated_pct: number;
  black_protestant_pct?: number;
  mormon_pct?: number;
  orthodox_pct?: number;
  jewish_pct?: number;
  muslim_pct?: number;
  buddhist_pct?: number;
  hindu_pct?: number;
  other_religions_pct?: number;
}

export interface CulturalHeritage {
  symbols: string[];
  state_bird: string;
  state_flower: string;
  state_tree: string;
  regional_vibe: string;
  military_ties: string[];
  popular_slogans: string[];
  lifestyle_environments: string[];
  archetype_prompt: string;
}

export interface USState {
  code: string;
  name: string;
  nickname: string;
  motto: string;
  capital: string;
  region: string;
  flag_url?: string;
  demographics: Demographics;
  religion_values: ReligionValues;
  cultural_heritage: CulturalHeritage;
}

export interface CreativeConcept {
  id: string;
  name: string;
  slogan: string;
  elements: string;
  palette: string;
  vibe: string;
  description_vi?: string;
}

export interface Artwork {
  id: string;
  title: string;
  state_code: string;
  state_name: string;
  theme: string;
  design_style: string;
  slogan: string;
  product_color: string;
  prompt: string;
  negative_prompt: string;
  provider: string;
  model_name: string;
  original_image_path?: string;
  transparent_image_path?: string;
  preview_url: string;
  width: number;
  height: number;
  dpi: number;
  metadata?: {
    audience?: string;
    product_type?: string;
    symbols?: string[];
    transparent_url?: string;
    garment_hex?: string;
    [key: string]: any;
  };
  created_at: string;
}

export interface Mockup {
  id: string;
  artwork_id?: string;
  title: string;
  target_state: string;
  garment_color: string;
  model_gender: string;
  model_age: string;
  model_vibe: string;
  environment: string;
  aspect_ratio: string;
  provider: string;
  mockup_image_path: string;
  preview_url: string;
  metadata?: {
    full_url?: string;
    clean_image_path?: string;
    width?: number;
    height?: number;
    mockup_type?: string;
    artwork_title?: string;
    model_body_type?: string;
    model_ethnicity?: string;
    camera_style?: string;
    pose?: string;
    print_placement?: string;
    custom_x_pct?: number;
    custom_y_pct?: number;
    custom_scale?: number;
    custom_rotation?: number;
    blend_mode?: string;
    opacity?: number;
    [key: string]: any;
  };
  created_at: string;
}

export interface DesignIdea {
  title: string;
  visual_style: string;
  keyword: string;
  note: string;
}

export interface ProviderStatus {
  available: boolean;
  wallet?: string;
  estimated_images?: number;
  message?: string;
}

export interface BYOKSettings {
  falKey: string;
  replicateKey: string;
  geminiKey: string;
  openaiKey: string;
  fashnKey: string;
  defaultImageProvider: string;
  defaultMockupProvider: string;
}

export interface DpiInspectionResult {
  filename: string;
  width: number;
  height: number;
  aspect_ratio: string;
  dpi_x: number;
  dpi_y: number;
  effective_dpi: number;
  has_dpi_metadata: boolean;
  print_size_at_current_dpi: {
    inches: string;
    cm: string;
    width_in: number;
    height_in: number;
    width_cm: number;
    height_cm: number;
  };
  print_size_at_300dpi: {
    inches: string;
    cm: string;
    width_in: number;
    height_in: number;
    width_cm: number;
    height_cm: number;
  };
  has_alpha: boolean;
  is_pure_transparent: boolean;
  mode: string;
  file_size_kb?: number;
  quality_score: number;
  grade: "EXCELLENT" | "GOOD_HIGH_DPI" | "ACCEPTABLE" | "MEDIUM" | "POOR";
  grade_label: string;
  detail_desc: string;
  status_color: string;
  is_ready_for_pod: boolean;
  recommendations: string[];
}

export interface DpiUpscaleResponse {
  success: boolean;
  artwork_id: string;
  target_mode: string;
  master_path: string;
  preview_path: string;
  master_url: string;
  preview_url: string;
  before: DpiInspectionResult;
  after: DpiInspectionResult;
  summary: string;
  saved_artwork?: Artwork;
}
