"use client";

import React, { useRef, useState } from "react";
import { 
  Shirt, 
  User, 
  MapPin, 
  Sun, 
  Camera, 
  Crop, 
  Upload, 
  Check, 
  ShieldCheck,
  Sparkles,
  Layers,
  Loader2,
  Crosshair,
  Wand2,
  RefreshCw,
  FileText,
  Dices
} from "lucide-react";
import { Artwork, USState } from "@/lib/types";
import { uploadCustomGarmentApi, analyzeUploadedMockupApi } from "@/lib/api";

interface MockupConfigPanelProps {
  artworks: Artwork[];
  selectedArtworkId: string;
  onSelectArtworkId: (id: string) => void;
  states: USState[];
  targetStateCode: string;
  setTargetStateCode: (code: string) => void;
  garmentColor: string;
  setGarmentColor: (color: string) => void;
  mockupType: "lifestyle" | "flatlay" | "custom_mockup";
  setMockupType: (type: "lifestyle" | "flatlay" | "custom_mockup") => void;
  lifestyleScene: string;
  setLifestyleScene: (scene: string) => void;
  productStyle?: string;
  setProductStyle?: (style: string) => void;
  printPlacement: string;
  setPrintPlacement: (placement: string) => void;
  modelGender: string;
  setModelGender: (g: string) => void;
  modelAge: string;
  setModelAge: (a: string) => void;
  modelBodyType: string;
  setModelBodyType: (b: string) => void;
  modelEthnicity: string;
  setModelEthnicity: (e: string) => void;
  cameraStyle: string;
  setCameraStyle: (cs: string) => void;
  pose: string;
  setPose: (p: string) => void;
  aspectRatio: string;
  setAspectRatio: (ar: string) => void;
  customGarmentUrl: string | null;
  setCustomGarmentUrl: (url: string | null) => void;
  uploadedMockupUrl?: string | null;
  setUploadedMockupUrl?: (url: string | null) => void;
  customMockupPrompt?: string;
  setCustomMockupPrompt?: (prompt: string) => void;
  provider: string;
  setProvider: (p: string) => void;
  isGenerating: boolean;
  onGenerateMockup: () => void;
  // Freeform placement & blending controls
  customXPct?: number;
  setCustomXPct?: (x: number) => void;
  customYPct?: number;
  setCustomYPct?: (y: number) => void;
  customScale?: number;
  setCustomScale?: (s: number) => void;
  customRotation?: number;
  setCustomRotation?: (r: number) => void;
  blendMode?: string;
  setBlendMode?: (m: string) => void;
  opacity?: number;
  setOpacity?: (o: number) => void;
  onApplyPlacement?: () => void;
  isApplyingPlacement?: boolean;
  hasActiveMockup?: boolean;
}

const GARMENT_COLORS = [
  { id: "Black", label: "Đen (Black)", hex: "#141416" },
  { id: "Navy Heather", label: "Xanh Navy", hex: "#1e293b" },
  { id: "Military Green", label: "Rêu Quân Đội", hex: "#3d4b3c" },
  { id: "Sport Grey", label: "Xám Thể Thao", hex: "#9ca3af" }
];

// General Scene Categories: dynamically combined with target state geography
const LIFESTYLE_SCENES = [
  { 
    id: "outdoor_lifestyle", 
    name: "Đời Thường Ngoài Trời (Outdoor Lifestyle)", 
    desc: "Khung cảnh thiên nhiên, núi đồi, đồng cỏ bản địa đặc trưng theo Bang Mục Tiêu" 
  },
  { 
    id: "residential_porch", 
    name: "Hiên Nhà Khu Dân Cư (Suburban Porch)", 
    desc: "Hiên nhà gỗ ấm cúng, khu ngoại ô sân vườn xanh mát theo phong cách Bang" 
  },
  { 
    id: "urban_street", 
    name: "Phố Thị Hiện Đại (Downtown Urban)", 
    desc: "Đường phố trung tâm, kiến trúc đô thị năng động đặc trưng của Bang" 
  },
  { 
    id: "workshop_garage", 
    name: "Xưởng Cơ Khí & Garage (Artisan Workshop)", 
    desc: "Xưởng làm việc mộc mạc, dụng cụ vintage phong trần chuẩn người lao động" 
  },
  { 
    id: "commercial_studio", 
    name: "Studio Sản Phẩm Sạch (Clean Studio)", 
    desc: "Ánh sáng studio tối giản trung tính chuẩn danh mục Etsy và Amazon" 
  }
];

// Product shoot styles for Flat-Lay (Without Model)
const PRODUCT_STYLES = [
  { 
    id: "flatlay_wood", 
    name: "Trải Sàn Gỗ Mộc (Rustic Reclaimed Wood)", 
    desc: "Mặt bàn gỗ mộc rustic tự nhiên, ánh sáng ấm cúng chân thực" 
  },
  { 
    id: "flatlay_studio", 
    name: "Studio Tối Giản (Amazon / Etsy Clean)", 
    desc: "Nền trung tính sáng sạch chuyên nghiệp chuẩn sàn thương mại điện tử" 
  },
  { 
    id: "hanger_wall", 
    name: "Móc Gỗ Treo Tường (Wall Hanger)", 
    desc: "Áo treo trên móc gỗ tự nhiên trên nền tường studio hiện đại" 
  },
  { 
    id: "folded_display", 
    name: "Gấp Gọn Trưng Bày (Boutique Folded)", 
    desc: "Áo gấp gọn tinh tế trên bàn trưng bày cửa hàng thời trang cao cấp" 
  }
];

// Print placement options on garment
const PRINT_PLACEMENTS = [
  { 
    id: "center_chest", 
    label: "Giữa Ngực (Center Chest)", 
    desc: "In DTG tiêu chuẩn chính giữa ngực áo (vùng in 30x35 cm)",
    defaults: { x: 50, y: 58, scale: 25, rot: 0 }
  },
  { 
    id: "left_chest", 
    label: "Ngực Trái / Túi Áo (Left Chest)", 
    desc: "Logo thương hiệu nhỏ gọn trên ngực trái (10x10 cm)",
    defaults: { x: 60, y: 52, scale: 12, rot: 0 }
  },
  { 
    id: "sleeve", 
    label: "Cánh Tay Áo (Sleeve Patch)", 
    desc: "Huy hiệu in trên bắp tay áo (10x10 cm)",
    defaults: { x: 70, y: 48, scale: 14, rot: 0 }
  },
  { 
    id: "side_pose", 
    label: "Dáng Nghiêng (Side Pose / Profile)", 
    desc: "Tối ưu cho người mẫu đứng nghiêng hoặc quay đầu nhìn xa",
    defaults: { x: 30, y: 82, scale: 22, rot: -6 }
  },
  { 
    id: "full_back", 
    label: "Mặt Lưng (Full Back)", 
    desc: "In khổ lớn trên toàn bộ mặt sau lưng áo (35x45 cm)",
    defaults: { x: 50, y: 58, scale: 32, rot: 0 }
  },
  { 
    id: "oversized_center", 
    label: "Khổ Lớn Streetwear (Oversized)", 
    desc: "Họa tiết graphic lớn phủ từ ngực xuống thân áo (38x48 cm)",
    defaults: { x: 51, y: 64, scale: 34, rot: 0 }
  },
  { 
    id: "custom", 
    label: "Tùy Chỉnh Tự Do (Freeform)", 
    desc: "Tự do đặt logo ở mọi vị trí, xoay góc và chỉnh kích thước",
    defaults: { x: 50, y: 58, scale: 25, rot: 0 }
  }
];

const BLEND_MODES = [
  { id: "natural_dtg", label: "DTG Tự Nhiên (Đổ bóng nếp vải & sợi cotton)" },
  { id: "multiply", label: "Hòa Trộn Đậm Đà (Multiply)" },
  { id: "vintage_wash", label: "Hiệu Ứng Bạc Màu Cổ Điển (Vintage Wash)" },
  { id: "vibrant", label: "Màu Sắc Nổi Bật (Vibrant Pop)" }
];

const GENDERS = [
  { id: "Random", label: "🎲 Ngẫu Nhiên (Nam / Nữ Đổi Liên Tục)" },
  { id: "Male", label: "Nam (Male)" },
  { id: "Female", label: "Nữ (Female)" },
  { id: "Couple", label: "Cặp đôi (Couple)" }
];

const AGE_BRACKETS = [
  { id: "Random", label: "🎲 Ngẫu Nhiên Mọi Độ Tuổi" },
  { id: "20-30", label: "20-30 tuổi (Thanh Niên Trẻ)" },
  { id: "30-40", label: "30-40 tuổi (Trưởng Thành)" },
  { id: "40-50", label: "40-50 tuổi (Chững Chạc)" },
  { id: "50+", label: "Trên 50 tuổi (Cựu Binh / Phong Trần)" }
];

const BODY_TYPES = [
  { id: "Athletic", label: "Thể thao (Athletic)" },
  { id: "Average", label: "Cân đối (Average)" },
  { id: "Slim", label: "Thon gọn (Slim)" },
  { id: "Plus-size", label: "Đầy đặn (Plus-size)" }
];

const ETHNICITIES = [
  { id: "Random", label: "🎲 Ngẫu Nhiên Sắc Tộc (Mỗi Lần 1 Mặt)" },
  { id: "State AI Proposed", label: "Theo Nhân Khẩu Bang (AI Gợi Ý)" },
  { id: "Diverse", label: "Đa Dạng (Diverse)" },
  { id: "White / Caucasian", label: "Da Trắng (Caucasian)" },
  { id: "Black / African American", label: "Da Màu (African American)" },
  { id: "Hispanic / Latino", label: "Gốc Tây Ban Nha (Latino)" },
  { id: "Asian", label: "Châu Á (Asian)" },
  { id: "Native American", label: "Bản Địa Mỹ (Native American)" }
];

const CAMERA_STYLES = [
  { id: "Lifestyle", label: "Đời thường (Lifestyle)" },
  { id: "Commercial", label: "Thương mại (Commercial)" },
  { id: "Editorial", label: "Tạp chí thời trang (Editorial)" },
  { id: "Close-up", label: "Cận cảnh chi tiết áo (Close-up)" }
];

const POSES = [
  { id: "Standing", label: "Đứng thẳng tự nhiên" },
  { id: "Sitting on Porch", label: "Ngồi thư giãn trước hiên" },
  { id: "Walking Outdoors", label: "Đang bước đi ngoài trời" },
  { id: "Heroic Front View", label: "Góc chính diện kiêu hãnh" }
];

const RATIOS = [
  { id: "3:4", label: "3:4", sub: "Full Cả Áo (Gốc)" },
  { id: "4:5", label: "4:5", sub: "Etsy / Instagram" },
  { id: "1:1", label: "1:1", sub: "Vuông Catalog" },
  { id: "16:9", label: "16:9", sub: "Banner Ngang" }
];

export const MockupConfigPanel: React.FC<MockupConfigPanelProps> = ({
  artworks,
  selectedArtworkId,
  onSelectArtworkId,
  states,
  targetStateCode,
  setTargetStateCode,
  garmentColor,
  setGarmentColor,
  mockupType,
  setMockupType,
  lifestyleScene,
  setLifestyleScene,
  productStyle = "flatlay_wood",
  setProductStyle,
  printPlacement,
  setPrintPlacement,
  modelGender,
  setModelGender,
  modelAge,
  setModelAge,
  modelBodyType,
  setModelBodyType,
  modelEthnicity,
  setModelEthnicity,
  cameraStyle,
  setCameraStyle,
  pose,
  setPose,
  aspectRatio,
  setAspectRatio,
  customGarmentUrl,
  setCustomGarmentUrl,
  uploadedMockupUrl,
  setUploadedMockupUrl,
  customMockupPrompt,
  setCustomMockupPrompt,
  provider,
  setProvider,
  isGenerating,
  onGenerateMockup,
  customXPct = 0.50,
  setCustomXPct,
  customYPct = 0.58,
  setCustomYPct,
  customScale = 0.25,
  setCustomScale,
  customRotation = 0,
  setCustomRotation,
  blendMode = "natural_dtg",
  setBlendMode,
  opacity = 0.96,
  setOpacity,
  onApplyPlacement,
  isApplyingPlacement = false,
  hasActiveMockup = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customMockupInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzingMockup, setIsAnalyzingMockup] = useState(false);
  const [detectedGarment, setDetectedGarment] = useState<{ color?: string; scene?: string } | null>(null);

  const activeArt = artworks.find((a) => a.id === selectedArtworkId);
  const selectedStateObj = states.find((s) => s.code === targetStateCode);

  const handleCustomMockupUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzingMockup(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("artwork_id", selectedArtworkId || (artworks[0]?.id ?? ""));
      formData.append("print_placement", printPlacement);
      formData.append("target_state", targetStateCode);

      const res = await analyzeUploadedMockupApi(formData);
      if (res.success) {
        setUploadedMockupUrl?.(res.uploaded_mockup_url);
        setCustomMockupPrompt?.(res.prompt);
        setDetectedGarment({ color: res.garment_color, scene: res.scene_type });
        if (res.garment_color) setGarmentColor(res.garment_color);
      }
    } catch (err: any) {
      alert("Phân tích ảnh mockup thất bại: " + (err.message || "Lỗi không xác định"));
    } finally {
      setIsAnalyzingMockup(false);
    }
  };

  const handlePlacementChangeWithPromptUpdate = async (newPlacement: string) => {
    setPrintPlacement(newPlacement);
    const matchedPreset = PRINT_PLACEMENTS.find(p => p.id === newPlacement);
    if (matchedPreset?.defaults) {
      setCustomXPct?.(matchedPreset.defaults.x / 100);
      setCustomYPct?.(matchedPreset.defaults.y / 100);
      setCustomScale?.(matchedPreset.defaults.scale / 100);
      setCustomRotation?.(matchedPreset.defaults.rot);
    }

    if (mockupType === "custom_mockup" && uploadedMockupUrl && selectedArtworkId) {
      setIsAnalyzingMockup(true);
      try {
        const formData = new FormData();
        formData.append("mockup_url", uploadedMockupUrl);
        formData.append("artwork_id", selectedArtworkId);
        formData.append("print_placement", newPlacement);
        formData.append("target_state", targetStateCode);

        const res = await analyzeUploadedMockupApi(formData);
        if (res.success) {
          setCustomMockupPrompt?.(res.prompt);
        }
      } catch (err) {
        console.error("Error updating prompt for placement:", err);
      } finally {
        setIsAnalyzingMockup(false);
      }
    }
  };

  const handleSelectPlacementPreset = (preset: typeof PRINT_PLACEMENTS[0]) => {
    handlePlacementChangeWithPromptUpdate(preset.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadCustomGarmentApi(file);
      setCustomGarmentUrl(res.garment_url);
    } catch (err: any) {
      alert("Garment upload failed: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* 1. Artwork Picker */}
      <div className="space-y-1.5">
        <label className="font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Shirt className="w-3.5 h-3.5 text-amber-400" />
            1. Chọn Thiết Kế Artwork
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {artworks.length} Mẫu Thiết Kế
          </span>
        </label>

        {artworks.length > 0 ? (
          <select
            value={selectedArtworkId}
            onChange={(e) => onSelectArtworkId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
          >
            {artworks.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} &bull; "{a.slogan}" ({a.state_code})
              </option>
            ))}
          </select>
        ) : (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            Chưa có thiết kế nào. Hãy tạo một thiết kế ở Module 1 trước.
          </div>
        )}

        {activeArt && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-12 h-12 rounded-lg bg-slate-900 checkerboard-bg flex items-center justify-center overflow-hidden shrink-0 border border-slate-700">
              <img
                src={activeArt.preview_url}
                alt={activeArt.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-slate-200 truncate">{activeArt.title}</p>
              <p className="text-[11px] text-amber-400 font-semibold truncate">"{activeArt.slogan}"</p>
              <p className="text-[10px] text-slate-500">{activeArt.state_name} &bull; {activeArt.design_style}</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Photo Type Toggle (Model vs Flat Lay vs Custom Mockup) */}
      <div className="space-y-1.5 pt-1 border-t border-slate-800">
        <label className="font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <Shirt className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Chọn Chế Độ Mockup AI (3 Chế Độ)</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold uppercase">ShopAPI In Chìm Vào Vải</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setMockupType("lifestyle")}
            className={`py-2 px-1.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
              mockupType === "lifestyle"
                ? "border-amber-500 bg-amber-500/15 text-amber-300 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40"
                : "border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Có Người Mẫu</span>
            </div>
            <span className="text-[9px] font-normal text-slate-400 text-center leading-tight">Người thật mặc áo</span>
          </button>
          <button
            type="button"
            onClick={() => setMockupType("flatlay")}
            className={`py-2 px-1.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
              mockupType === "flatlay"
                ? "border-amber-500 bg-amber-500/15 text-amber-300 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40"
                : "border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center gap-1">
              <Shirt className="w-3.5 h-3.5 text-amber-400" />
              <span>Không Người Mẫu</span>
            </div>
            <span className="text-[9px] font-normal text-slate-400 text-center leading-tight">Trải sàn / Studio</span>
          </button>
          <button
            type="button"
            onClick={() => setMockupType("custom_mockup")}
            className={`py-2 px-1.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
              mockupType === "custom_mockup"
                ? "border-amber-500 bg-amber-500/15 text-amber-300 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40"
                : "border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center gap-1">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Up Mockup Mẫu</span>
            </div>
            <span className="text-[9px] font-normal text-slate-400 text-center leading-tight">AI tự viết prompt</span>
          </button>
        </div>
      </div>

      {/* Mode-Specific Settings */}
      {mockupType === "custom_mockup" ? (
        <div className="space-y-3 pt-1 border-t border-slate-800">
          {/* Upload Area for Custom Mockup */}
          <div className="space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Tải Lên Ảnh Mockup Mẫu (Người Thật Hoặc Flatlay)</span>
              </span>
              <span className="text-[10px] text-amber-400 font-mono">JPG / PNG / WEBP</span>
            </label>

            <input
              type="file"
              ref={customMockupInputRef}
              onChange={handleCustomMockupUpload}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />

            <div
              onClick={() => customMockupInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                uploadedMockupUrl
                  ? "border-amber-500/60 bg-slate-900/40"
                  : "border-slate-700 hover:border-amber-500/50 bg-slate-950/60 hover:bg-slate-900/40"
              }`}
            >
              {uploadedMockupUrl ? (
                <div className="flex items-center gap-3 w-full">
                  <img
                    src={uploadedMockupUrl}
                    alt="Custom Mockup Preview"
                    className="w-16 h-16 rounded-lg object-cover border border-slate-700 shrink-0"
                  />
                  <div className="text-left overflow-hidden">
                    <span className="text-[11px] font-bold text-amber-300 block truncate">
                      Đã tải lên ảnh áo mẫu
                    </span>
                    {detectedGarment && (
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Màu áo: <strong className="text-slate-200">{detectedGarment.color}</strong> &bull; Dạng: <strong className="text-slate-200">{detectedGarment.scene === "lifestyle" ? "Có người mẫu" : "Flat-lay"}</strong>
                      </span>
                    )}
                    <span className="text-[9.5px] text-slate-500 hover:underline cursor-pointer block mt-1">
                      Nhấn vào đây để đổi ảnh khác
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 py-2">
                  <Upload className="w-6 h-6 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-200">
                    Chọn hoặc thả ảnh áo mockup mẫu vào đây
                  </p>
                  <p className="text-[10px] text-slate-500">
                    AI sẽ tự nhận diện màu áo, bối cảnh và tự động viết prompt đưa thiết kế vào đúng vị trí
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Prompt AI Tự Động Viết */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5" />
                <span>Prompt AI Tự Động Viết Cho ShopAPI</span>
              </span>
              {isAnalyzingMockup ? (
                <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" /> Đang phân tích...
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePlacementChangeWithPromptUpdate(printPlacement)}
                  className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Cập nhật lại
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={customMockupPrompt || ""}
              onChange={(e) => setCustomMockupPrompt?.(e.target.value)}
              placeholder="Prompt AI tự động viết theo vị trí bạn chọn sẽ xuất hiện ở đây..."
              className="w-full p-2.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 text-[11px] font-mono focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
            />
            <p className="text-[9.5px] text-slate-500">
              Prompt tự cập nhật khi bạn đổi vị trí in bên dưới. Bạn có thể chỉnh sửa prompt theo ý muốn.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 3. Custom Garment Upload or Blank Picker */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Màu Áo & Mẫu Áo POD</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>+ Upload Áo Từ Printify/Printful</span>
              </button>
            </div>

            {customGarmentUrl ? (
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={customGarmentUrl} alt="Custom" className="w-8 h-8 rounded object-cover" />
                  <span className="text-[11px] font-bold text-amber-300">Đang Dùng Áo Upload Tùy Chỉnh</span>
                </div>
                <button
                  onClick={() => setCustomGarmentUrl(null)}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Dùng Áo Chuẩn
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {GARMENT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setGarmentColor(c.id)}
                    className={`p-1.5 rounded-lg border flex items-center gap-2 transition-all ${
                      garmentColor === c.id
                        ? "border-amber-500 bg-amber-500/10 text-white font-bold"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="truncate text-[11px]">{c.label}</span>
                    {garmentColor === c.id && <Check className="w-3 h-3 text-amber-400 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Target State */}
          <div className="space-y-1 pt-1 border-t border-slate-800">
            <label className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 text-xs">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>4. Bang Mục Tiêu (Phong Cách Thị Trường)</span>
            </label>
            <select
              value={targetStateCode}
              onChange={(e) => setTargetStateCode(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
            >
              {states.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code}) - {s.nickname}
                </option>
              ))}
            </select>
            {selectedStateObj && (
              <p className="text-[10px] text-slate-400 italic">
                Phong cách địa phương: {selectedStateObj.cultural_heritage?.regional_vibe || selectedStateObj.nickname}
              </p>
            )}
          </div>
        </>
      )}

      {/* 5. Vị Trí In Trên Áo (Print Placement) */}
      <div className="space-y-2 pt-1 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span>5. Vị Trí In & Tùy Chỉnh Tự Do</span>
          </label>
          <span className="text-[10px] text-emerald-400 font-semibold">Tự Do Đặt Mọi Vị Trí</span>
        </div>

        {/* Preset Cards */}
        <div className="grid grid-cols-2 gap-2">
          {PRINT_PLACEMENTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPlacementPreset(p)}
              className={`p-2 rounded-xl border text-left transition-all ${
                printPlacement === p.id
                  ? "border-amber-500 bg-amber-500/15 text-slate-100 shadow-sm shadow-amber-500/10"
                  : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[11px]">
                <span className={printPlacement === p.id ? "text-amber-400" : "text-slate-200"}>
                  {p.label}
                </span>
                {printPlacement === p.id && <Check className="w-3 h-3 text-amber-400" />}
              </div>
              <p className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">{p.desc}</p>
            </button>
          ))}
        </div>

        {/* Fine-Tune Sliders: X, Y, Scale, Rotation, Blend Mode */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 mt-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80 text-[11px]">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Chỉnh Tọa Độ Chính Xác & Hòa Trộn Vải</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              X:{Math.round(customXPct * 100)}% Y:{Math.round(customYPct * 100)}% Size:{Math.round(customScale * 100)}%
            </span>
          </div>

          {/* X & Y Sliders */}
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Vị trí X (Ngang)</span>
                <span className="font-mono text-slate-200">{Math.round(customXPct * 100)}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={Math.round(customXPct * 100)}
                onChange={(e) => {
                  setPrintPlacement("custom");
                  setCustomXPct?.(Number(e.target.value) / 100);
                }}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Vị trí Y (Dọc)</span>
                <span className="font-mono text-slate-200">{Math.round(customYPct * 100)}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={Math.round(customYPct * 100)}
                onChange={(e) => {
                  setPrintPlacement("custom");
                  setCustomYPct?.(Number(e.target.value) / 100);
                }}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Scale & Rotation Sliders */}
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Kích thước (%)</span>
                <span className="font-mono text-slate-200">{Math.round(customScale * 100)}%</span>
              </div>
              <input
                type="range"
                min="6"
                max="65"
                value={Math.round(customScale * 100)}
                onChange={(e) => {
                  setPrintPlacement("custom");
                  setCustomScale?.(Number(e.target.value) / 100);
                }}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span className="flex items-center gap-1">
                  <span>Góc xoay (Độ)</span>
                  {customRotation !== 0 && (
                    <button
                      type="button"
                      onClick={() => setCustomRotation?.(0)}
                      className="text-[9px] text-amber-400 hover:underline"
                    >
                      [0°]
                    </button>
                  )}
                </span>
                <span className="font-mono text-slate-200">{Math.round(customRotation)}°</span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                value={Math.round(customRotation)}
                onChange={(e) => {
                  setPrintPlacement("custom");
                  setCustomRotation?.(Number(e.target.value));
                }}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Blend Mode & Opacity */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-900 text-[11px]">
            <div className="space-y-1">
              <span className="text-slate-400 block">Kiểu Thấm Sợi Vải</span>
              <select
                value={blendMode}
                onChange={(e) => setBlendMode?.(e.target.value)}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-[11px]"
              >
                {BLEND_MODES.map((b) => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Độ chìm vào vải</span>
                <span className="font-mono text-slate-200">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="100"
                value={Math.round(opacity * 100)}
                onChange={(e) => setOpacity?.(Number(e.target.value) / 100)}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Instant Re-Composite Action Button */}
          {hasActiveMockup && onApplyPlacement && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onApplyPlacement}
                disabled={isApplyingPlacement || isGenerating}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isApplyingPlacement ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>Đang Đổ Bóng Nếp Vải Vào Vị Trí Mới...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                    <span>ÁP DỤNG VỊ TRÍ & ĐỔ BÓNG NẾP VẢI (&lt; 0.2s)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 6. Context Settings: Model Demographics (Lifestyle) or Product Style (Flat-Lay) */}
      {mockupType === "lifestyle" ? (
        <>
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 text-xs">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>6. Thông Số Người Mẫu AI</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setModelGender("Random");
                  setModelAge("Random");
                  setModelEthnicity("Random");
                }}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1 transition-all"
                title="Tự động ngẫu nhiên hóa để mỗi lần sinh một khuôn mặt mới khác biệt 100%"
              >
                <Dices className="w-3 h-3 text-amber-400" />
                <span>🎲 Bật Ngẫu Nhiên Người Mẫu</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Giới tính</span>
                <select
                  value={modelGender}
                  onChange={(e) => setModelGender(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs"
                >
                  {GENDERS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Độ tuổi</span>
                <select
                  value={modelAge}
                  onChange={(e) => setModelAge(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs"
                >
                  {AGE_BRACKETS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Vóc dáng</span>
                <select
                  value={modelBodyType}
                  onChange={(e) => setModelBodyType(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs"
                >
                  {BODY_TYPES.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Chủng tộc sắc tộc</span>
                <select
                  value={modelEthnicity}
                  onChange={(e) => setModelEthnicity(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs"
                >
                  {ETHNICITIES.map((eth) => <option key={eth.id} value={eth.id}>{eth.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 7. Bối Cảnh Ngoài Trời / Đời Thường Theo Bang */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>7. Bối Cảnh Đời Thường (Theo {selectedStateObj?.name || "Bang"})</span>
              </label>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {LIFESTYLE_SCENES.map((scene) => (
                <div
                  key={scene.id}
                  onClick={() => setLifestyleScene(scene.id)}
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    lifestyleScene === scene.id
                      ? "bg-amber-500/15 border-amber-500 text-slate-100"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[11px]">
                    <span className={lifestyleScene === scene.id ? "text-amber-400" : "text-slate-200"}>
                      {scene.name}
                    </span>
                    {lifestyleScene === scene.id && <Check className="w-3 h-3 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{scene.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Phong cách ảnh</span>
                <select
                  value={cameraStyle}
                  onChange={(e) => setCameraStyle(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs"
                >
                  {CAMERA_STYLES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Tư thế</span>
                <select
                  value={pose}
                  onChange={(e) => setPose(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs"
                >
                  {POSES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Flat-Lay Product Styles */
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 text-xs">
              <Shirt className="w-3.5 h-3.5 text-amber-400" />
              <span>6. Phong Cách Chụp Sản Phẩm (Không Có Người Mẫu)</span>
            </label>
            <span className="text-[10px] text-amber-400 font-semibold uppercase">Chuẩn Etsy / Amazon</span>
          </div>

          <div className="space-y-1.5">
            {PRODUCT_STYLES.map((style) => (
              <div
                key={style.id}
                onClick={() => setProductStyle?.(style.id)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  productStyle === style.id
                    ? "bg-amber-500/15 border-amber-500 text-slate-100 shadow-sm shadow-amber-500/10"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-[11px]">
                  <span className={productStyle === style.id ? "text-amber-400" : "text-slate-200"}>
                    {style.name}
                  </span>
                  {productStyle === style.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{style.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Tỷ Lệ Khung Hình (Ratio) */}
      <div className="space-y-1.5 pt-1 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Crop className="w-3.5 h-3.5 text-amber-400" />
            <span>8. Tỷ Lệ Khung Hình (Ratio)</span>
          </label>
          <span className="text-[10px] text-amber-400 font-medium">3:4 = Full Toàn Bộ Áo</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {RATIOS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setAspectRatio(r.id)}
              className={`py-1.5 px-1 rounded-lg text-center transition-all ${
                aspectRatio === r.id
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold"
                  : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <div className="text-[11px] font-bold">{r.label}</div>
              <div className="text-[9px] opacity-80 leading-tight truncate">{r.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Artwork Preservation Callout */}
      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 space-y-1">
        <p className="font-bold text-emerald-200 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Hallucination DTG Garment Embedding</span>
        </p>
        <p className="text-slate-300 leading-normal text-[10px]">
          Thiết kế được in chính xác vào sớ vải áo với nếp nhăn và ánh sáng thật. Bảo toàn 100% chữ tiếng Anh và logo, <span className="text-emerald-300 font-bold">không bao giờ bị AI vẽ lại sai chữ</span>.
        </p>
      </div>

      {/* Primary Action Button */}
      <button
        type="button"
        onClick={onGenerateMockup}
        disabled={isGenerating || !selectedArtworkId}
        className="w-full py-3.5 px-4 rounded-xl font-extrabold text-xs text-slate-950 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99]"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            <span>AI ShopAPI Đang Tạo Ảnh & In Chìm Vào Sợi Vải...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>
              {mockupType === "custom_mockup"
                ? "TẠO MOCKUP SHOPAPI TỪ ẢNH MẪU (DUAL-REF)"
                : mockupType === "lifestyle"
                ? "TẠO ẢNH CÓ NGƯỜI MẪU THẬT (SHOPAPI AI)"
                : "TẠO ẢNH ÁO TRẢI SÀN / STUDIO (SHOPAPI AI)"}
            </span>
          </>
        )}
      </button>
    </div>
  );
};
