"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Shirt, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Loader2,
  Camera,
  Share2,
  ShieldCheck,
  Split,
  Move,
  RotateCw,
  Sliders,
  Check,
  RotateCcw,
  RefreshCw,
  Crosshair,
  X,
  Eye
} from "lucide-react";
import { Mockup, Artwork } from "@/lib/types";

interface MockupCanvasPreviewProps {
  mockup: Mockup | null;
  activeArtwork: Artwork | undefined;
  isGenerating: boolean;
  onGenerate: () => void;
  targetStateCode: string;
  garmentColor: string;
  mockupType: string;
  lifestyleScene: string;
  printPlacement?: string;
  aspectRatio: string;
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
  onSelectPreset?: (presetId: string) => void;
}

const PRESET_COORDS: Record<string, { x: number; y: number; scale: number; rot: number; label: string }> = {
  center_chest: { x: 0.50, y: 0.58, scale: 0.25, rot: 0, label: "Giữa Ngực" },
  left_chest: { x: 0.60, y: 0.52, scale: 0.12, rot: 0, label: "Ngực Trái" },
  sleeve: { x: 0.70, y: 0.48, scale: 0.14, rot: 0, label: "Cánh Tay Áo" },
  side_pose: { x: 0.30, y: 0.82, scale: 0.22, rot: -6, label: "Dáng Nghiêng" },
  full_back: { x: 0.50, y: 0.58, scale: 0.32, rot: 0, label: "Mặt Lưng" },
  oversized_center: { x: 0.51, y: 0.64, scale: 0.34, rot: 0, label: "Khổ Lớn" }
};

export const MockupCanvasPreview: React.FC<MockupCanvasPreviewProps> = ({
  mockup,
  activeArtwork,
  isGenerating,
  onGenerate,
  targetStateCode,
  garmentColor,
  mockupType,
  lifestyleScene,
  printPlacement = "center_chest",
  aspectRatio,
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
  onSelectPreset
}) => {
  const [zoom, setZoom] = useState(100);
  const [showComparison, setShowComparison] = useState(false);
  const [isInteractiveMode, setIsInteractiveMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };
    if (isLightboxOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isLightboxOpen]);

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(50, Math.min(250, prev + delta)));
  };

  // Mouse drag logic on interactive overlay
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isInteractiveMode) return;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const clampedX = Math.max(0.05, Math.min(0.95, x));
    const clampedY = Math.max(0.05, Math.min(0.95, y));
    
    setCustomXPct?.(Math.round(clampedX * 100) / 100);
    setCustomYPct?.(Math.round(clampedY * 100) / 100);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const applyPreset = (presetId: string) => {
    const p = PRESET_COORDS[presetId];
    if (p) {
      setCustomXPct?.(p.x);
      setCustomYPct?.(p.y);
      setCustomScale?.(p.scale);
      setCustomRotation?.(p.rot);
      onSelectPreset?.(presetId);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Left Column: Mockup Setup Inspector & CTA */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Quy Trình & Tùy Chỉnh Vị Trí In
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>DTG In-Fiber Chân Thực</span>
          </span>
        </div>

        {/* Configuration Summary Card */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Thông Số Ghép Áo Thương Mại
          </span>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Màu áo:</span>
              <span className="font-semibold text-slate-200">{garmentColor}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Kiểu hiển thị:</span>
              <span className="font-semibold text-slate-200 capitalize">
                {mockupType === "lifestyle" ? "Người Mẫu AI (Lifestyle)" : "Áo Trải Sàn (Flat Lay)"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Tọa độ vị trí in:</span>
              <span className="font-mono text-amber-400 font-bold">
                X: {Math.round(customXPct * 100)}% &bull; Y: {Math.round(customYPct * 100)}%
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Kích thước & Góc xoay:</span>
              <span className="font-mono text-amber-400">
                {Math.round(customScale * 100)}% áo &bull; {Math.round(customRotation)}°
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Hòa trộn nếp vải:</span>
              <span className="font-semibold text-emerald-400">
                {blendMode === "multiply"
                  ? "Hòa Trộn Đậm (Multiply)"
                  : blendMode === "vintage_wash"
                  ? "Bạc Màu Vintage"
                  : blendMode === "vibrant"
                  ? "Màu Sắc Nổi Bật"
                  : "DTG Tự Nhiên (Đổ bóng nếp gấp)"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Tỷ lệ khung hình:</span>
              <span className="font-semibold text-slate-200">{aspectRatio}</span>
            </div>
          </div>
        </div>

        {/* Quick Placement Presets Palette */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>Vị Trí Mẫu Nhanh</span>
            </span>
            <span className="text-[10px] text-slate-500">Nhấp để đặt tức thì</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {Object.entries(PRESET_COORDS).map(([key, val]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`py-1 px-2 rounded-lg text-[10.5px] font-semibold border transition-all text-center truncate ${
                  Math.abs(customXPct - val.x) < 0.03 && Math.abs(customYPct - val.y) < 0.03
                    ? "border-amber-500 bg-amber-500/15 text-amber-300"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {val.label}
              </button>
            ))}
          </div>
        </div>

        {/* Artwork Snapshot Preview */}
        {activeArtwork ? (
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Artwork Đang Chọn Để In Áo
            </span>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-slate-900 checkerboard-bg border border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={activeArtwork.preview_url}
                  alt={activeArtwork.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="overflow-hidden text-xs">
                <p className="font-bold text-slate-200 truncate">{activeArtwork.title}</p>
                <p className="text-[11px] text-amber-400 font-medium truncate">"{activeArtwork.slogan}"</p>
                <p className="text-[10px] text-slate-400">{activeArtwork.state_name} &bull; {activeArtwork.design_style}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
            Vui lòng chọn một thiết kế artwork để tạo ảnh mockup.
          </div>
        )}

        {/* Action Buttons: Generate AI Mockup */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || !activeArtwork}
            className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>ShopAPI Đang Tạo Ảnh & In Chìm Vào Sợi Vải...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 fill-slate-950" />
                <span>
                  {mockupType === "lifestyle"
                    ? "TẠO ẢNH CÓ NGƯỜI MẪU THẬT (SHOPAPI AI)"
                    : "TẠO ẢNH ÁO TRẢI SÀN / STUDIO (SHOPAPI AI)"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Column: Live Mockup Canvas & Viewport */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Controls Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {mockupType === "lifestyle"
                ? "Ảnh Người Mẫu Mặc Áo Thực Tế (ShopAPI AI)"
                : "Ảnh Áo Trải Sàn / Studio Thương Mại (ShopAPI AI)"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {mockup && activeArtwork && (
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-colors ${
                  showComparison
                    ? "bg-amber-500/20 text-amber-300 border-amber-500"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                <span>So Sánh Bản Thiết Kế</span>
              </button>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-xs">
              <button onClick={() => handleZoom(-25)} className="p-1 hover:text-amber-400 text-slate-400" title="Thu nhỏ">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-300 w-10 text-center">{zoom}%</span>
              <button onClick={() => handleZoom(25)} className="p-1 hover:text-amber-400 text-slate-400" title="Phóng to">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsLightboxOpen(true)} 
                disabled={!mockup}
                className="p-1 hover:text-amber-400 text-slate-400 ml-1 transition-colors disabled:opacity-30" 
                title="Xem toàn màn hình (Phóng to 100%)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Viewport Box */}
        <div className="flex-1 min-h-[480px] rounded-xl border border-slate-800 bg-[#090d16] flex items-center justify-center overflow-auto p-4 relative select-none">
          {isGenerating ? (
            <div className="text-center space-y-3 z-10 bg-slate-950/90 p-6 rounded-2xl border border-slate-800 backdrop-blur">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping" />
                <div className="relative w-12 h-12 rounded-full border-2 border-t-amber-500 border-amber-500/30 animate-spin flex items-center justify-center">
                  <Shirt className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <p className="font-bold text-sm text-slate-100">
                  {mockupType === "lifestyle"
                    ? "ShopAPI Đang Tạo Người Mẫu Thật & In Áo..."
                    : "ShopAPI Đang Tạo Ảnh Áo Trải Sàn / Studio Thương Mại..."}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Đang dùng thiết kế làm reference image để in trực tiếp vào sợi vải theo vị trí đã chọn
                </p>
              </div>
            </div>
          ) : mockup ? (
            showComparison && activeArtwork ? (
              <div className="grid grid-cols-2 gap-4 w-full h-full items-center">
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">File Thiết Kế Gốc (PNG Master)</span>
                  <div className="checkerboard-bg p-3 rounded-lg border border-slate-800 h-[380px] flex items-center justify-center">
                    <img src={activeArtwork.preview_url} alt="Decal" className="max-h-full object-contain" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase text-amber-400">
                    {mockupType === "lifestyle" ? "Ảnh Người Mẫu Mặc Áo Thật" : "Ảnh Sản Phẩm Áo Thật"}
                  </span>
                  <div className="p-1 rounded-lg border border-slate-800 h-[380px] flex items-center justify-center bg-slate-950">
                    <img src={mockup.preview_url} alt="Mockup" className="max-h-full object-contain rounded" />
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="transition-transform duration-150 flex items-center justify-center relative"
                style={{ transform: `scale(${zoom / 100})` }}
              >
                {/* Base Image Container */}
                <div
                  ref={imageContainerRef}
                  onClick={() => setIsLightboxOpen(true)}
                  className="relative inline-block overflow-hidden rounded-xl shadow-2xl border border-slate-800 max-h-[580px] cursor-zoom-in group"
                  title="Nhấp vào ảnh để phóng to toàn màn hình (Full HD)"
                >
                  <img
                    src={mockup.preview_url}
                    alt={mockup.title}
                    className="max-h-[580px] max-w-full object-contain block select-none group-hover:brightness-105 transition-all"
                    draggable={false}
                  />
                  {/* Hover Hint Overlay */}
                  <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/85 backdrop-blur border border-slate-700 text-slate-200 text-[10.5px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xl pointer-events-none">
                    <Maximize2 className="w-3 h-3 text-amber-400" />
                    <span>Phóng To Toàn Màn Hình</span>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="text-center space-y-2 text-slate-500 max-w-xs p-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                <Camera className="w-6 h-6" />
              </div>
              <p className="font-semibold text-xs text-slate-400">Chưa Có Ảnh Mockup Nào</p>
              <p className="text-[11px] text-slate-500">
                Chọn kiểu mockup (Có người mẫu hoặc Không có người mẫu), chọn vị trí in trên áo và nhấn Tạo Ảnh Mockup để ShopAPI sinh ảnh thực tế.
              </p>
            </div>
          )}

          {/* Placement & Status Badge */}
          {mockup && !isGenerating && (
            <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800 backdrop-blur px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10.5px] text-slate-300 shadow-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-amber-400">
                {mockupType === "lifestyle" ? "Người Mẫu AI Thật" : "Áo Trải Sàn Studio"}
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-slate-200 font-semibold">
                Vị trí: {PRESET_COORDS[printPlacement]?.label || "Giữa Ngực"}
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="font-mono text-emerald-400 font-bold">{mockup.aspect_ratio}</span>
            </div>
          )}
        </div>

        {/* Mockup Download Bar */}
        {mockup && !isGenerating && (
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-200">{mockup.title}</p>
              <p className="text-[11px] text-slate-400 font-medium">Sẵn sàng đăng bán trên Etsy, Amazon, Shopify</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onGenerate}
                disabled={isGenerating}
                className="py-2 px-3 rounded-lg text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Tạo lại người mẫu AI hoặc góc chụp khác"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Tạo Mẫu Khác</span>
              </button>
              <a
                href={`/static/mockups/${mockup.id}.png`}
                download={`MOCKUP_${mockup.id}_${mockup.garment_color}.png`}
                className="py-2 px-3 rounded-lg text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải Ảnh Mockup (HD)</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && mockup && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Header */}
          <div 
            className="flex items-center justify-between z-10 w-full max-w-7xl mx-auto pb-3 border-b border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm text-slate-100">{mockup.title}</span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Tỉ lệ: {mockup.aspect_ratio || aspectRatio}
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Màu áo: <strong className="text-slate-200">{mockup.garment_color}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`/static/mockups/${mockup.id}.png`}
                download={`MOCKUP_${mockup.id}_${mockup.garment_color}.png`}
                className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải Ảnh Gốc HD</span>
              </a>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Đóng (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Body (Full Image) */}
          <div 
            className="flex-1 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden"
            onClick={() => setIsLightboxOpen(false)}
          >
            <img
              src={mockup.preview_url}
              alt={mockup.title}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-[92vw] object-contain rounded-xl shadow-2xl border border-slate-800"
            />
          </div>

          {/* Lightbox Footer */}
          <div 
            className="text-center text-xs text-slate-400 z-10 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">ESC</kbd> hoặc nhấp ra ngoài để đóng xem toàn màn hình</span>
          </div>
        </div>
      )}
    </div>
  );
};
