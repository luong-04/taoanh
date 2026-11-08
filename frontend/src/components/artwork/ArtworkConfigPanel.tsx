"use client";

import React from "react";
import { 
  Sparkles, 
  MapPin, 
  Palette, 
  Type, 
  Cpu, 
  RefreshCw, 
  Check, 
  Shirt, 
  Users, 
  Tag, 
  Layers,
  Wand2,
  Sliders,
  Scissors,
  LayoutGrid
} from "lucide-react";
import { USState } from "@/lib/types";

interface ArtworkConfigPanelProps {
  states: USState[];
  selectedStateCode: string;
  onSelectState: (code: string) => void;
  selectedState: USState | undefined;
  theme: string;
  setTheme: (theme: string) => void;
  niche: string;
  setNiche: (niche: string) => void;
  audience: string;
  setAudience: (audience: string) => void;
  designLayout: string;
  setDesignLayout: (layout: string) => void;
  designStyle: string;
  setDesignStyle: (style: string) => void;
  productType: string;
  setProductType: (type: string) => void;
  slogan: string;
  setSlogan: (slogan: string) => void;
  slogansList: string[];
  isLoadingSlogans: boolean;
  onRefreshSlogans: () => void;
  productColor: string;
  setProductColor: (color: string) => void;
  batchSize: number;
  setBatchSize: (size: number) => void;
  workingMode: "guided" | "manual";
  setWorkingMode: (mode: "guided" | "manual") => void;
  provider: string;
  setProvider: (provider: string) => void;
  onOpenSettings: () => void;
  onOpenExtractorModal?: () => void;
}

// Danh sách Chủ Đề chính (giữ nguyên đầy đủ)
const THEMES = [
  { id: "Veteran", label: "Cựu Chiến Binh (Veteran)" },
  { id: "Army", label: "Lục Quân (Army)" },
  { id: "Navy", label: "Hải Quân (Navy)" },
  { id: "Air Force", label: "Không Quân (Air Force)" },
  { id: "Marines", label: "Thủy Quân Lục Chiến (Marines)" },
  { id: "Coast Guard", label: "Tuần Duyên (Coast Guard)" },
  { id: "Patriotic", label: "Yêu Nước Mỹ (Patriotic)" },
  { id: "4th of July", label: "Quốc Khánh 4/7 (Independence)" },
  { id: "Military Dad", label: "Bố Cựu Binh (Dad)" },
  { id: "Lunar New Year", label: "Tết / Lễ Hội (Lunar New Year)" },
  { id: "Christmas", label: "Giáng Sinh (Christmas)" },
  { id: "Fishing", label: "Câu Cá (Fishing)" },
  { id: "Mechanic", label: "Thợ Sửa Xe (Mechanic)" },
  { id: "Woodworker", label: "Thợ Mộc (Woodworker)" },
  { id: "Police", label: "Cảnh Sát (Police)" },
  { id: "Firefighter", label: "Cứu Hỏa (Firefighter)" },
  { id: "Hunting", label: "Săn Bắn (Hunting)" },
  { id: "Nurse", label: "Y Tá / Điều Dưỡng (Nurse)" }
];

// 7 Ngách Chiến Tranh & Thời Kỳ Cựu Binh để kết hợp cùng Chủ Đề sinh ra Slogan AI
export const VETERAN_NICHES = [
  { id: "none", label: "Chung / Mặc định", badge: "All", desc: "Slogan chung theo chủ đề" },
  { id: "Vietnam Veteran", label: "Vietnam Veteran", badge: "Vietnam", desc: "Cựu Binh Chiến Tranh VN" },
  { id: "Vietnam Era Veteran", label: "Vietnam Era Veteran", badge: "Era", desc: "Cựu Binh Thời Kỳ VN" },
  { id: "Desert Storm Veteran", label: "Desert Storm Veteran", badge: "1991", desc: "Chiến Dịch Bão Sa Mạc" },
  { id: "Iraq War Veteran", label: "Iraq War Veteran", badge: "OIF", desc: "Chiến Tranh Iraq" },
  { id: "Afghanistan Veteran", label: "Afghanistan Veteran", badge: "OEF", desc: "Chiến Tranh Afghan" },
  { id: "Korean War Veteran", label: "Korean War Veteran", badge: "1950", desc: "Chiến Tranh Triều Tiên" },
  { id: "WWII Veteran", label: "WWII Veteran", badge: "WW2", desc: "Thế Chiến II" }
];

const AUDIENCES = [
  { id: "All Veterans", label: "Tất Cả Khách Hàng (All Veterans)" },
  { id: "Men", label: "Nam Giới (Men)" },
  { id: "Women", label: "Nữ Giới (Women)" },
  { id: "Military Dad", label: "Người Bố (Dad)" },
  { id: "Military Grandpa", label: "Người Ông (Grandpa)" },
  { id: "Military Family", label: "Gia Đình & Trẻ Em (Family)" }
];

const PRODUCT_TYPES = [
  { id: "T-shirt", label: "Áo Thun Cổ Tròn (T-shirt)" },
  { id: "Hoodie", label: "Áo Hoodie Có Mũ" },
  { id: "Sweatshirt", label: "Áo Nỉ (Sweatshirt)" },
  { id: "Long Sleeve", label: "Áo Tay Dài (Long Sleeve)" }
];

const DESIGN_LAYOUTS = [
  {
    id: "open_silhouette",
    label: "Không Viền / Tự Do",
    badge: "Hot",
    icon: "🌟",
    desc: "Đồ họa mở tự nhiên, không viền gò bó, chữ uốn vòm, linh vật bung rộng"
  },
  {
    id: "tactical_shield",
    label: "Khiên Quân Đội",
    badge: "Mạnh Mẽ",
    icon: "🛡️",
    desc: "Dáng khiên chiến thuật góc cạnh, uy nghi, phù hiệu lực lượng đặc nhiệm"
  },
  {
    id: "arched_chest",
    label: "Chữ Vòm Ngang",
    badge: "Varsity",
    icon: "↔️",
    desc: "Typography chữ vòm lớn ngang ngực, linh vật trung tâm, phong cách Mỹ"
  },
  {
    id: "circular_badge",
    label: "Huy Hiệu Tròn",
    badge: "Cổ Điển",
    icon: "⭕",
    desc: "Form tròn vintage truyền thống, viền đồng tâm, dải ruy băng cuộn tròn"
  },
  {
    id: "diamond_polygon",
    label: "Hình Thoi Chiến Thuật",
    badge: "Hiện Đại",
    icon: "💎",
    desc: "Form hình thoi 4 đỉnh góc cạnh, phong cách patch phi đội bay và tác chiến"
  },
  {
    id: "hexagon_patch",
    label: "Lục Giác Công Nghệ",
    badge: "High-Tech",
    icon: "⬡",
    desc: "Phù hiệu tổ ong 6 cạnh hiện đại, sắc sảo phong cách công nghệ quân sự"
  },
  {
    id: "vintage_oval",
    label: "Bầu Dục Cổ Điển",
    badge: "Heritage",
    icon: "📜",
    desc: "Khuôn oval bầu dục kéo dài thanh lịch, con dấu di sản Americana"
  },
  {
    id: "minimalist_decal",
    label: "Decal Vector Tối Giản",
    badge: "Gọn Gàng",
    icon: "⚡",
    desc: "Đường nét phẳng sắc nét, không viền nền nặng nề, điểm nhấn hiện đại"
  }
];

const DESIGN_STYLES = [
  { id: "Vintage Distressed", label: "Cổ Điển Phai Màu (Vintage)", desc: "Màu phai cổ điển, vết nứt sơn phong trần, phong cách retro 1970s" },
  { id: "Bold Screen-Print", label: "In Lụa Sắc Nét (Screen-Print)", desc: "Mực in lụa dày, độ tương phản cao, poster đồ họa mạnh mẽ" },
  { id: "Modern Minimalist", label: "Tối Giản Hiện Đại (Minimalist)", desc: "Đường nét vector gọn gàng, tinh tế, biểu tượng hiện đại" },
  { id: "Retro Tactical", label: "Patch Quân Đội (Tactical)", desc: "Phù hiệu lực lượng vũ trang, viền thêu nổi, chữ stencil chiến thuật" },
  { id: "Typography Focus", label: "Tập Trung Typography", desc: "Chữ nghệ thuật vẽ tay ấn tượng, dải ruy băng uốn lượn phong cách Mỹ" }
];

const PRODUCT_COLORS = [
  { id: "Black", label: "Đen (Black)", hex: "#141416" },
  { id: "Navy Heather", label: "Xanh Navy", hex: "#1e293b" },
  { id: "Military Green", label: "Rêu Quân Đội", hex: "#3d4b3c" },
  { id: "Sport Grey", label: "Xám Thể Thao", hex: "#9ca3af" }
];


const PROVIDERS = [
  { id: "shopapi", label: "ShopAPI (youtube-main)", badge: "Active • ~1,596 AI Images" },
  { id: "local_demo", label: "Local Studio Engine", badge: "Free / 100% Offline" },
  { id: "fal", label: "Fal.ai (Flux.1 Schnell)", badge: "BYOK" },
  { id: "replicate", label: "Replicate (Flux / SDXL)", badge: "BYOK" },
  { id: "gemini", label: "Google Imagen 3 / Gemini", badge: "BYOK" },
  { id: "openai", label: "OpenAI (DALL-E 3)", badge: "BYOK" }
];

export const ArtworkConfigPanel: React.FC<ArtworkConfigPanelProps> = ({
  states,
  selectedStateCode,
  onSelectState,
  selectedState,
  theme,
  setTheme,
  niche,
  setNiche,
  audience,
  setAudience,
  designLayout,
  setDesignLayout,
  designStyle,
  setDesignStyle,
  productType,
  setProductType,
  slogan,
  setSlogan,
  slogansList,
  isLoadingSlogans,
  onRefreshSlogans,
  productColor,
  setProductColor,
  batchSize,
  setBatchSize,
  workingMode,
  setWorkingMode,
  provider,
  setProvider,
  onOpenSettings,
  onOpenExtractorModal
}) => {
  return (
    <div className="space-y-4">
      {/* 4K Logo Extractor Quick Action */}
      {onOpenExtractorModal && (
        <button
          type="button"
          onClick={onOpenExtractorModal}
          className="w-full p-2.5 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent hover:from-amber-500/30 hover:border-amber-400 transition-all text-left flex items-center justify-between group shadow-lg shadow-amber-500/5"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/30 shrink-0 group-hover:scale-105 transition-transform">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-amber-300">TÁCH LOGO TỪ ÁO (4K EXTRACTOR)</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/40">NEW</span>
              </div>
              <p className="text-[10px] text-slate-400">Up áo có logo & AI tự tách thành file 4K trong suốt</p>
            </div>
          </div>
          <span className="text-[11px] text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
        </button>
      )}

      {/* Mode Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Studio Mode:
        </span>
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setWorkingMode("guided")}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
              workingMode === "guided"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wand2 className="w-3 h-3" />
            <span>AI Guided</span>
          </button>
          <button
            type="button"
            onClick={() => setWorkingMode("manual")}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
              workingMode === "manual"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Manual</span>
          </button>
        </div>
      </div>

      {/* 1. Target US State Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            1. Target State (50 Bang)
          </span>
          <span className="text-[10px] text-amber-400 font-mono">
            {selectedState?.code} &bull; ACS 2024
          </span>
        </label>

        <select
          value={selectedStateCode}
          onChange={(e) => onSelectState(e.target.value)}
          className="w-full px-3 py-2 text-xs font-bold bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          {states.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name} ({s.code}) - {s.nickname}
            </option>
          ))}
        </select>
      </div>

      {/* 1.5. State Intelligence & Dynamic AI Slogan Generator */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/30 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Bản Sắc Bang {selectedState?.code} ({selectedState?.name})
          </label>
          <button
            type="button"
            onClick={onRefreshSlogans}
            disabled={isLoadingSlogans}
            className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-bold transition-all shadow-sm"
            title="AI tạo lại gợi ý slogan động cho bang này"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingSlogans ? "animate-spin" : ""}`} />
            Đổi Slogan AI
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[9px] font-medium">Biệt danh / Nickname:</span>
            <span className="text-amber-200 font-bold truncate block">{selectedState?.nickname || "The Free State"}</span>
          </div>
          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[9px] font-medium">Khẩu hiệu / Motto:</span>
            <span className="text-amber-200 font-bold truncate block">{selectedState?.motto || "In God We Trust"}</span>
          </div>
        </div>

        {selectedState?.cultural_heritage?.symbols && selectedState.cultural_heritage.symbols.length > 0 && (
          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 overflow-hidden pt-0.5">
            <span className="text-amber-400 font-bold shrink-0">Biểu tượng:</span>
            <span className="truncate text-slate-300">
              {selectedState.cultural_heritage.symbols.slice(0, 3).join(" • ")}
            </span>
          </div>
        )}
      </div>

      {/* 2. Theme Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            2. Chủ Đề Chính (Theme)
          </label>
          <span className="text-[10px] text-amber-400 font-mono">Tự gõ hoặc chọn nhanh</span>
        </div>

        {/* Input box to type ANY custom theme */}
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="Nhập chủ đề tùy ý (vd: Veteran, Army, Tết, Giáng sinh, Câu cá...)"
          className="w-full px-3 py-2 text-xs bg-slate-950 border border-amber-500/50 rounded-xl text-amber-300 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-bold shadow-inner"
        />

        {/* Quick theme buttons */}
        <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold text-center truncate transition-all ${
                theme.toLowerCase() === t.id.toLowerCase()
                  ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                  : "bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800"
              }`}
              title={t.label}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Target Audience */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span>3. Đối Tượng Khách Hàng (Audience)</span>
        </label>
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          {AUDIENCES.map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
      </div>

      {/* 4. Khung Dáng & Bố Cục (Layout Shape) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
            <span>4. Dáng Khung & Bố Cục (Layout Shape)</span>
          </label>
          <span className="text-[10px] text-amber-400 font-mono">8 dáng</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {DESIGN_LAYOUTS.map((layout) => (
            <div
              key={layout.id}
              onClick={() => setDesignLayout(layout.id)}
              className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                designLayout === layout.id
                  ? "bg-amber-500/15 border-amber-400 text-slate-100 shadow-sm ring-1 ring-amber-400/30"
                  : "bg-slate-950/70 border-slate-800/80 hover:border-slate-700 text-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between font-bold text-[11px] mb-0.5">
                  <span className="flex items-center gap-1 truncate">
                    <span>{layout.icon}</span>
                    <span className={designLayout === layout.id ? "text-amber-300 font-black" : "text-slate-200"}>
                      {layout.label}
                    </span>
                  </span>
                  {designLayout === layout.id && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                </div>
                <p className="text-[9.5px] text-slate-400 line-clamp-2 leading-tight">{layout.desc}</p>
              </div>
              <div className="pt-1 mt-1 border-t border-slate-800/50 flex justify-between items-center text-[9px]">
                <span className="text-[8.5px] px-1 py-0.2 rounded bg-slate-900 text-amber-400/90 font-mono border border-slate-800">
                  {layout.badge}
                </span>
                {designLayout === layout.id && <span className="text-amber-400 font-bold text-[9px]">Đang chọn</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Design Style */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span>5. Phong Cách Thiết Kế</span>
        </label>
        <div className="space-y-1">
          {DESIGN_STYLES.map((style) => (
            <div
              key={style.id}
              onClick={() => setDesignStyle(style.id)}
              className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                designStyle === style.id
                  ? "bg-amber-500/15 border-amber-500 text-slate-100"
                  : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[11px]">
                <span className={designStyle === style.id ? "text-amber-400" : "text-slate-200"}>
                  {style.label}
                </span>
                {designStyle === style.id && <Check className="w-3 h-3 text-amber-400" />}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">{style.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Slogan & Slogan Suggestions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span>6. Slogan Tiếng Anh (In Trên Áo)</span>
          </label>
          <button
            onClick={onRefreshSlogans}
            disabled={isLoadingSlogans}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:border-amber-400 transition-all shadow-sm"
            title="Nhấp để AI ShopAPI tạo ra slogan mới khác biệt"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingSlogans ? "animate-spin text-amber-300" : ""}`} />
            <span>{isLoadingSlogans ? "ShopAPI AI đang sinh..." : "Đổi Slogan AI"}</span>
          </button>
        </div>

        <input
          type="text"
          value={slogan}
          onChange={(e) => setSlogan(e.target.value)}
          placeholder="Nhập slogan tiếng Anh hoặc chọn bên dưới..."
          className="w-full px-3 py-2 text-xs bg-slate-950 border border-amber-500/50 rounded-xl text-amber-200 focus:outline-none focus:border-amber-400 font-bold shadow-inner"
        />

        {/* 7 Ngách Chiến Tranh & Thời Kỳ Cựu Binh để AI ShopAPI kết hợp cùng Chủ Đề */}
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Chọn Ngách Kết Hợp Với Chủ Đề (ShopAPI AI Slogan):</span>
            </span>
            <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
              {niche && niche !== "none" ? niche : "Chung"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Chọn 1 ngách dưới đây để AI ShopAPI kết hợp cùng chủ đề <b>"{theme}"</b> sinh ra slogan mang đúng ý nghĩa lịch sử:
          </p>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {VETERAN_NICHES.map((n) => {
              const isSelected = (niche === n.id) || (n.id === "none" && (!niche || niche === "none"));
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setNiche(n.id)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-bold text-left truncate transition-all flex items-center justify-between border ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 ring-1 ring-amber-400 border-amber-400"
                      : "bg-slate-900/90 hover:bg-slate-800 text-amber-200/90 border-slate-800 hover:border-amber-500/40"
                  }`}
                  title={`${n.label} - ${n.desc}`}
                >
                  <span className="truncate">{n.label}</span>
                  {n.badge && (
                    <span className={`text-[8px] px-1 rounded uppercase font-black shrink-0 ${
                      isSelected
                        ? "bg-slate-950 text-amber-400"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}>
                      {n.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Spacious, high-contrast slogan suggestions box */}
        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Slogan Tạo Thật Từ ShopAPI AI (Claude Sonnet 5) &bull; Bang {selectedState?.code} {niche && niche !== "none" ? `&bull; ${niche}` : ""}
            </span>
            <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              {slogansList.length} gợi ý
            </span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
            {slogansList.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSlogan(s)}
                className={`text-left text-xs px-2.5 py-2 rounded-lg border transition-all flex items-center justify-between gap-2 group ${
                  slogan === s
                    ? "bg-amber-500/25 border-amber-400 text-amber-200 font-bold shadow-md shadow-amber-500/10 ring-1 ring-amber-400/40"
                    : "bg-slate-900/90 border-slate-800 text-slate-100 hover:bg-slate-800 hover:border-amber-500/50 hover:text-white"
                }`}
              >
                <span className="leading-snug">"{s}"</span>
                {slogan === s ? (
                  <span className="flex items-center gap-1 text-[10px] text-amber-300 font-bold shrink-0 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                    <Check className="w-3 h-3 text-amber-400" />
                    Đang chọn
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 group-hover:text-amber-400 opacity-60 group-hover:opacity-100 transition-opacity shrink-0 font-medium">
                    Chọn
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Batch Size & Provider */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Số Lượng Bản Vẽ (Batch)</span>
          </label>
          <div className="flex gap-1">
            {[1, 2, 4].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setBatchSize(size)}
                className={`w-7 h-6 rounded text-xs font-bold flex items-center justify-center transition-colors ${
                  batchSize === size
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-900 text-slate-400 border border-slate-800"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Bộ Máy Sinh Ảnh AI (Engine)</span>
            </label>
            <button onClick={onOpenSettings} className="text-[10px] text-amber-400 hover:underline">
              Cài Đặt Key
            </button>
          </div>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} ({p.badge})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
