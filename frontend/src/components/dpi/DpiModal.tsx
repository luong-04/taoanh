"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Sparkles,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Shirt,
  ArrowRight,
  Loader2,
  Gauge,
  Layers,
  Ruler,
  FileCheck,
  Zap,
  Info
} from "lucide-react";
import { Artwork, DpiInspectionResult, DpiUpscaleResponse } from "@/lib/types";
import { inspectDpiApi, upscaleDpiApi } from "@/lib/api";

interface DpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentArtwork?: Artwork | null;
  onArtworkUpscaled?: (newArtwork: Artwork, autoNavigateToMockup?: boolean) => void;
}

export const DpiModal: React.FC<DpiModalProps> = ({
  isOpen,
  onClose,
  currentArtwork,
  onArtworkUpscaled
}) => {
  // Input source: "current_artwork" | "upload"
  const [sourceType, setSourceType] = useState<"current_artwork" | "upload">(
    currentArtwork ? "current_artwork" : "upload"
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Inspection states
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [inspection, setInspection] = useState<DpiInspectionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Upscale configuration states
  const [targetMode, setTargetMode] = useState<string>("dtg_standard");
  const [enhanceSharpness, setEnhanceSharpness] = useState<boolean>(true);
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(false);
  const [designTitle, setDesignTitle] = useState<string>("");

  // Processing & Result states
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
  const [upscaleProgressStep, setUpscaleProgressStep] = useState<number>(0);
  const [upscaleResult, setUpscaleResult] = useState<DpiUpscaleResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or re-inspect when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setUpscaleResult(null);
      if (currentArtwork && currentArtwork.preview_url) {
        setSourceType("current_artwork");
        setPreviewSrc(currentArtwork.preview_url);
        setDesignTitle(`${currentArtwork.title} (300 DPI Master)`);
        handleInspectArtwork(currentArtwork);
      } else {
        setSourceType("upload");
        setInspection(null);
        setPreviewSrc(null);
      }
    }
  }, [isOpen, currentArtwork]);

  if (!isOpen) return null;

  // Inspect existing Artwork via API
  const handleInspectArtwork = async (art: Artwork) => {
    setIsInspecting(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("artwork_id", art.id);
      const res = await inspectDpiApi(formData);
      setInspection(res);
      if (!res.has_alpha) {
        setAutoRemoveBg(true);
      }
    } catch (err: any) {
      console.error("DPI Inspect error:", err);
      setErrorMsg(err.message || "Không thể kiểm tra thông số DPI của ảnh này.");
    } finally {
      setIsInspecting(false);
    }
  };

  // Inspect uploaded file
  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setUpscaleResult(null);
    setErrorMsg(null);
    setDesignTitle(`${file.name.replace(/\.[^/.]+$/, "")} (300 DPI Master)`);

    // Create local preview
    const reader = new FileReader();
    reader.onload = () => setPreviewSrc(reader.result as string);
    reader.readAsDataURL(file);

    // Call Inspect API
    setIsInspecting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await inspectDpiApi(formData);
      setInspection(res);
      if (!res.has_alpha) {
        setAutoRemoveBg(true);
      }
    } catch (err: any) {
      console.error("DPI Inspect error:", err);
      setErrorMsg(err.message || "Không thể đọc thông số DPI từ file vừa chọn.");
    } finally {
      setIsInspecting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSourceType("upload");
      handleFileSelected(file);
    }
  };

  // Execute Upscale to 300 DPI
  const handleStartUpscale = async () => {
    setIsUpscaling(true);
    setErrorMsg(null);
    setUpscaleProgressStep(1);

    const t1 = setTimeout(() => setUpscaleProgressStep(2), 800);
    const t2 = setTimeout(() => setUpscaleProgressStep(3), 2000);
    const t3 = setTimeout(() => setUpscaleProgressStep(4), 3800);

    try {
      const formData = new FormData();
      if (sourceType === "current_artwork" && currentArtwork) {
        formData.append("artwork_id", currentArtwork.id);
      } else if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        throw new Error("Vui lòng chọn ảnh cần nâng cấp 300 DPI.");
      }

      formData.append("target_mode", targetMode);
      formData.append("enhance_sharpness", enhanceSharpness ? "true" : "false");
      formData.append("auto_remove_background", autoRemoveBg ? "true" : "false");
      formData.append("save_to_library", "true");
      if (designTitle.trim()) {
        formData.append("title", designTitle.trim());
      }
      formData.append("state_code", currentArtwork?.state_code || "US");

      const res = await upscaleDpiApi(formData);
      setUpscaleResult(res);
      setUpscaleProgressStep(5);

      if (res.saved_artwork && onArtworkUpscaled) {
        onArtworkUpscaled(res.saved_artwork, false);
      }
    } catch (err: any) {
      console.error("Upscale 300 DPI error:", err);
      setErrorMsg(err.message || "Quá trình nâng cấp 300 DPI thất bại.");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsUpscaling(false);
    }
  };

  // Send to Mockup Studio
  const handleSendToMockupStudio = () => {
    if (upscaleResult?.saved_artwork && onArtworkUpscaled) {
      onArtworkUpscaled(upscaleResult.saved_artwork, true);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Xác Định DPI &amp; Nâng Cấp Lên 300 DPI Chuẩn POD
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  300 DPI Master
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kiểm tra thông số in ấn, kích thước inch/cm và nâng cấp file đạt chuẩn in công nghiệp DTG (4500×5400 px).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!upscaleResult ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column (5 cols): Image Preview & Inspection Status */}
              <div className="md:col-span-5 space-y-4">
                {/* Source Selection Tabs */}
                <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  {currentArtwork && (
                    <button
                      type="button"
                      onClick={() => {
                        setSourceType("current_artwork");
                        setPreviewSrc(currentArtwork.preview_url);
                        handleInspectArtwork(currentArtwork);
                      }}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                        sourceType === "current_artwork"
                          ? "bg-amber-500 text-slate-950 shadow"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Thiết Kế Hiện Tại
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSourceType("upload");
                      if (!selectedFile) fileInputRef.current?.click();
                    }}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                      sourceType === "upload"
                        ? "bg-amber-500 text-slate-950 shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Tải Ảnh Từ Máy Tính
                  </button>
                </div>

                {/* Dropzone / Preview Area */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSourceType("upload");
                      handleFileSelected(f);
                    }
                  }}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (sourceType === "upload") fileInputRef.current?.click();
                  }}
                  className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center min-h-[260px] text-center overflow-hidden ${
                    previewSrc
                      ? "border-slate-700 bg-slate-950"
                      : "border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/50 cursor-pointer"
                  }`}
                >
                  {isInspecting ? (
                    <div className="space-y-2 py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-300">Đang quét thông số DPI &amp; Resolution...</p>
                    </div>
                  ) : previewSrc ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <img
                        src={previewSrc}
                        alt="Preview"
                        className="max-h-56 max-w-full object-contain rounded-lg drop-shadow-md"
                      />
                      {sourceType === "upload" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="mt-2 text-[11px] text-amber-400 hover:underline font-semibold"
                        >
                          Chọn ảnh khác từ máy
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 py-6">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">Kéo thả ảnh hoặc nhấn để tải lên</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Hỗ trợ PNG, JPG, WebP</p>
                      </div>
                    </div>
                  )}

                  {/* DPI Badge on Preview */}
                  {inspection && (
                    <div className="absolute top-2.5 left-2.5 bg-slate-900/90 border border-slate-700 backdrop-blur px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-mono">
                      <span className="font-bold text-slate-300">DPI:</span>
                      <span
                        className={`font-black ${
                          inspection.effective_dpi >= 300
                            ? "text-emerald-400"
                            : inspection.effective_dpi >= 200
                            ? "text-blue-400"
                            : "text-amber-400"
                        }`}
                      >
                        {inspection.effective_dpi} DPI
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Diagnostics Box */}
                {inspection && (
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Ruler className="w-3.5 h-3.5 text-amber-400" />
                        Độ Phân Giải Pixel:
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {inspection.width} &times; {inspection.height} px
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        Kích Thước In Vật Lý (Inch):
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {inspection.print_size_at_current_dpi.inches}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                        Kích Thước In Vật Lý (Cm):
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {inspection.print_size_at_current_dpi.cm}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Gauge className="w-3.5 h-3.5 text-amber-400" />
                        Đánh Giá Chất Lượng POD:
                      </span>
                      <span
                        className={`font-black text-[11px] ${
                          inspection.grade === "EXCELLENT"
                            ? "text-emerald-400"
                            : inspection.grade === "GOOD_HIGH_DPI"
                            ? "text-blue-400"
                            : inspection.grade === "ACCEPTABLE"
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {inspection.grade_label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column (7 cols): Configuration & Upscale Actions */}
              <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-1">
                      <Zap className="w-4 h-4" />
                      1. Chọn Chế Độ Nâng Cấp Chất Lượng 300 DPI
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Tự động tính toán số điểm ảnh cần thiết để in ngực áo không bị vỡ hạt theo tiêu chuẩn POD quốc tế.
                    </p>
                  </div>

                  {/* Mode Selection Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Mode 1: DTG Standard 4500x5400 */}
                    <div
                      onClick={() => setTargetMode("dtg_standard")}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        targetMode === "dtg_standard"
                          ? "border-amber-500 bg-amber-500/10 text-slate-100 shadow-lg shadow-amber-500/10"
                          : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-slate-100">Khổ Vàng DTG Master</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          Khuyên dùng
                        </span>
                      </div>
                      <p className="text-[11px] font-mono font-bold text-amber-400">4500 &times; 5400 px @ 300 DPI</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Khổ in chuẩn của Merch by Amazon, Printful, Printify. Căn giữa chuẩn ngực áo.
                      </p>
                    </div>

                    {/* Mode 2: Proportional Scale 300 DPI */}
                    <div
                      onClick={() => setTargetMode("proportional_300dpi")}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        targetMode === "proportional_300dpi"
                          ? "border-amber-500 bg-amber-500/10 text-slate-100 shadow-lg shadow-amber-500/10"
                          : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-slate-100">Phóng Tỉ Lệ Gốc</span>
                        <span className="text-[9px] font-mono text-slate-400">300 DPI</span>
                      </div>
                      <p className="text-[11px] font-mono font-bold text-amber-400">Cạnh dài 4500 px</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Bảo toàn 100% tỉ lệ khung hình ban đầu, nâng mật độ in lên 300 DPI sắc nét.
                      </p>
                    </div>

                    {/* Mode 3: 2X Upscale */}
                    <div
                      onClick={() => setTargetMode("scale_2x")}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        targetMode === "scale_2x"
                          ? "border-amber-500 bg-amber-500/10 text-slate-100 shadow-lg shadow-amber-500/10"
                          : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-slate-100">Phóng To 2X</span>
                        <span className="text-[9px] font-mono text-slate-400">300 DPI</span>
                      </div>
                      <p className="text-[11px] font-mono font-bold text-amber-400">200% Kích thước</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Nhân đôi số lượng điểm ảnh kết hợp làm nét cạnh chữ và chi tiết hoa văn.
                      </p>
                    </div>

                    {/* Mode 4: 4X Upscale */}
                    <div
                      onClick={() => setTargetMode("scale_4x")}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        targetMode === "scale_4x"
                          ? "border-amber-500 bg-amber-500/10 text-slate-100 shadow-lg shadow-amber-500/10"
                          : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-slate-100">Phóng To 4X Siêu Nét</span>
                        <span className="text-[9px] font-mono text-slate-400">4K Master</span>
                      </div>
                      <p className="text-[11px] font-mono font-bold text-amber-400">400% Kích thước</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Đạt độ phân giải cực đại cho các thiết kế nhiều chi tiết nhỏ cần in decal lớn.
                      </p>
                    </div>
                  </div>

                  {/* Title & Options */}
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-300 font-medium">Tên File Xuất Master:</span>
                      <input
                        type="text"
                        value={designTitle}
                        onChange={(e) => setDesignTitle(e.target.value)}
                        placeholder="Ví dụ: Texas Veteran Eagle 4500x5400 300DPI"
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-2 p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={enhanceSharpness}
                          onChange={(e) => setEnhanceSharpness(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                        />
                        <span className="text-slate-200 font-medium">
                          Khử Mờ &amp; Tăng Độ Nét Viền (Smart Lanczos + Unsharp Masking)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={autoRemoveBg}
                          onChange={(e) => setAutoRemoveBg(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                        />
                        <span className="text-slate-200 font-medium">
                          Tự động tách nền trong suốt hoàn toàn (Alpha = 0) nếu ảnh còn nền trắng
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Advice Box */}
                  {inspection?.recommendations && inspection.recommendations.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-slate-300 space-y-1">
                      <p className="font-bold text-amber-400 flex items-center gap-1 text-xs">
                        <Info className="w-3.5 h-3.5" />
                        Khuyến nghị in ấn POD:
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                        {inspection.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Upscale CTA Button */}
                <button
                  type="button"
                  disabled={!previewSrc || isUpscaling || isInspecting}
                  onClick={handleStartUpscale}
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl mt-4 ${
                    !previewSrc || isUpscaling || isInspecting
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                      : "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20 active:scale-[0.99]"
                  }`}
                >
                  {isUpscaling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Đang Nâng Cấp Lên 300 DPI Chuẩn In DTG...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>BẮT ĐẦU NÂNG CẤP LÊN 300 DPI CHUẨN IN NGAY</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Result Screen: Completed Upscale */
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Success Banner */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-emerald-300">
                      Nâng Cấp Thành Công File Master 300 DPI Chuẩn Công Nghiệp!
                    </h3>
                    <p className="text-xs text-slate-400">{upscaleResult.summary}</p>
                  </div>
                </div>
                <span className="hidden sm:inline-block px-3 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {upscaleResult.after.effective_dpi} DPI &bull; 100% Ready
                </span>
              </div>

              {/* Before vs After Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Before Card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Ảnh Ban Đầu ({upscaleResult.before.effective_dpi} DPI)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {upscaleResult.before.width} &times; {upscaleResult.before.height} px
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[300px]">
                    <img
                      src={previewSrc || ""}
                      alt="Before Upscale"
                      className="max-h-72 object-contain rounded-lg"
                    />
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex justify-between font-mono">
                    <span>In tối đa: {upscaleResult.before.print_size_at_300dpi.inches}</span>
                    <span className="text-amber-400">{upscaleResult.before.grade_label}</span>
                  </div>
                </div>

                {/* After Card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      File Master 300 DPI Sau Nâng Cấp
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {upscaleResult.after.width} &times; {upscaleResult.after.height} px &bull; 300 DPI
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 checkerboard-bg border border-slate-700 flex items-center justify-center min-h-[300px] shadow-inner">
                    <img
                      src={upscaleResult.preview_url}
                      alt="300 DPI Master"
                      className="max-h-72 object-contain"
                    />
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-300 flex justify-between font-mono">
                    <span>
                      Khổ in DTG áo: {upscaleResult.after.print_size_at_300dpi.inches} ({upscaleResult.after.print_size_at_300dpi.cm})
                    </span>
                    <span className="font-bold text-emerald-400">Chuẩn In DTG</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setUpscaleResult(null)}
                  className="text-xs text-slate-400 hover:text-slate-200 font-semibold"
                >
                  &larr; Nâng Cấp Ảnh Khác
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <a
                    href={upscaleResult.master_url}
                    download={`${upscaleResult.artwork_id}_300DPI_master.png`}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Tải File 300 DPI Master (.PNG)</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleSendToMockupStudio}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                  >
                    <Shirt className="w-4 h-4" />
                    <span>Đưa Vào Mockup Studio Mới Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Status during Upscaling */}
          {isUpscaling && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span>Tiến Trình Xử Lý Độ Phân Giải 300 DPI</span>
                <span className="text-amber-400 font-mono">Đang thực hiện...</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-[10px]">
                <div
                  className={`p-2 rounded-lg border text-center transition-all ${
                    upscaleProgressStep >= 1
                      ? "border-amber-500 bg-amber-500/15 text-amber-300 font-bold"
                      : "border-slate-800 bg-slate-950 text-slate-500"
                  }`}
                >
                  1. Đọc Phân Giải
                </div>
                <div
                  className={`p-2 rounded-lg border text-center transition-all ${
                    upscaleProgressStep >= 2
                      ? "border-amber-500 bg-amber-500/15 text-amber-300 font-bold"
                      : "border-slate-800 bg-slate-950 text-slate-500"
                  }`}
                >
                  2. Khử Nền Alpha
                </div>
                <div
                  className={`p-2 rounded-lg border text-center transition-all ${
                    upscaleProgressStep >= 3
                      ? "border-amber-500 bg-amber-500/15 text-amber-300 font-bold"
                      : "border-slate-800 bg-slate-950 text-slate-500"
                  }`}
                >
                  3. Phóng To Lanczos
                </div>
                <div
                  className={`p-2 rounded-lg border text-center transition-all ${
                    upscaleProgressStep >= 4
                      ? "border-amber-500 bg-amber-500/15 text-amber-300 font-bold"
                      : "border-slate-800 bg-slate-950 text-slate-500"
                  }`}
                >
                  4. Xuất 300 DPI
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

