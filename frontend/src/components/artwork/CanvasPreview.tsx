"use client";

import React, { useState } from "react";
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Shirt, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ExternalLink,
  ShieldCheck,
  Gauge
} from "lucide-react";
import { Artwork } from "@/lib/types";

interface CanvasPreviewProps {
  artwork: Artwork | null;
  onSendToMockup: (artwork: Artwork) => void;
  isGenerating: boolean;
  onOpenDpiModal?: () => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  artwork,
  onSendToMockup,
  isGenerating,
  onOpenDpiModal
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [bgPreview, setBgPreview] = useState<"checkerboard" | "black" | "navy" | "green" | "grey">("checkerboard");

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(50, Math.min(250, prev + delta)));
  };

  const getBgStyle = () => {
    switch (bgPreview) {
      case "black":
        return "bg-[#141416]";
      case "navy":
        return "bg-[#1e293b]";
      case "green":
        return "bg-[#3d4b3c]";
      case "grey":
        return "bg-[#9ca3af]";
      default:
        return "checkerboard-bg";
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Xem Trước Thiết Kế Master DTG (Trong Suốt)
          </h2>
        </div>

        {/* Background Contrast Checker */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-medium">Nền hiển thị:</span>
          <button
            onClick={() => setBgPreview("checkerboard")}
            className={`px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 transition-all ${
              bgPreview === "checkerboard" ? "border-amber-400 bg-amber-500/20 text-amber-300" : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
            title="Nền caro trong suốt chuẩn in DTG"
          >
            <span>Trong Suốt (Alpha)</span>
          </button>
          <button
            onClick={() => setBgPreview("black")}
            className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
              bgPreview === "black" ? "border-amber-400 bg-amber-500/20 text-amber-300" : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
            title="Kiểm tra tương phản trên nền tối"
          >
            <span>Nền Tối</span>
          </button>
          <button
            onClick={() => setBgPreview("grey")}
            className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
              bgPreview === "grey" ? "border-amber-400 bg-amber-500/20 text-amber-300" : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
            title="Kiểm tra tương phản trên nền trung tính"
          >
            <span>Nền Xám</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => handleZoom(-25)}
            className="p-1 hover:text-amber-400 text-slate-400"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-300 w-10 text-center">{zoom}%</span>
          <button
            onClick={() => handleZoom(25)}
            className="p-1 hover:text-amber-400 text-slate-400"
            title="Phóng to"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="p-1 hover:text-amber-400 text-slate-400 ml-1"
            title="Vừa khung hình"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        className={`flex-1 min-h-[380px] rounded-xl border border-slate-800 flex items-center justify-center overflow-auto p-4 relative ${getBgStyle()}`}
      >
        {isGenerating ? (
          <div className="text-center space-y-3 z-10 bg-slate-950/80 p-6 rounded-2xl border border-slate-800 backdrop-blur">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping" />
              <div className="relative w-12 h-12 rounded-full border-2 border-t-amber-500 border-amber-500/30 animate-spin flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <p className="font-bold text-sm text-slate-100">AI Đang Tạo Thiết Kế...</p>
              <p className="text-xs text-slate-400 mt-1">Đang gọi ShopAPI và tách nền trong suốt 4500x5400 px (300 DPI)</p>
            </div>
          </div>
        ) : artwork ? (
          <div
            className="transition-transform duration-150 flex items-center justify-center"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <img
              src={artwork.preview_url}
              alt={artwork.title}
              className="max-h-[440px] max-w-full object-contain drop-shadow-2xl select-none"
            />
          </div>
        ) : (
          <div className="text-center space-y-2 text-slate-500 max-w-xs p-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="font-semibold text-xs text-slate-200">Sẵn Sàng Tạo Thiết Kế Master DTG</p>
            <p className="text-[11px] text-slate-400">
              Chọn bang, nhập chủ đề (vd: Tết, Giáng sinh, Câu cá...) và nhấn Tạo Thiết Kế để sinh file artwork PNG 4500x5400 tách nền.
            </p>
          </div>
        )}

        {/* DTG Specs Badge Overlay */}
        {artwork && !isGenerating && (
          <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800 backdrop-blur px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-[10px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-emerald-400 font-bold">4500 &times; 5400 px</span>
            <span className="text-slate-500">&bull;</span>
            <span className="font-mono">300 DPI</span>
            <span className="text-slate-500">&bull;</span>
            <span>Nền Trong Suốt (DTG Decal)</span>
          </div>
        )}
      </div>

      {/* Output Actions Bar */}
      {artwork && !isGenerating && (
        <div className="space-y-3 pt-2">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-200">{artwork.title}</p>
              <p className="text-[11px] text-slate-400 font-medium">"{artwork.slogan}"</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {artwork.provider}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={artwork.transparent_image_path ? `/static/artworks/${artwork.id}_dtg_master.png` : artwork.preview_url}
              download={`POD_${artwork.state_code}_${artwork.theme}_4500x5400_300DPI.png`}
              className="py-2.5 px-3 rounded-lg text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Tải File In DTG (PNG)</span>
            </a>

            <button
              onClick={() => onSendToMockup(artwork)}
              className="py-2.5 px-3 rounded-lg text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chuyển Sang Module 2 Tạo Mockup Người Mẫu Thật &rarr;</span>
            </button>

            {onOpenDpiModal && (
              <button
                type="button"
                onClick={onOpenDpiModal}
                className="col-span-2 py-2.5 px-3 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>Kiểm Tra DPI &amp; Nâng Cấp Chất Lượng Lên 300 DPI Chuẩn In POD &rarr;</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

