"use client";

import React, { useState, useRef } from "react";
import { 
  X, 
  Upload, 
  Sparkles, 
  Scissors, 
  CheckCircle2, 
  Download, 
  Shirt, 
  ArrowRight, 
  Loader2, 
  Layers, 
  Eye, 
  AlertCircle 
} from "lucide-react";
import { Artwork, USState } from "@/lib/types";
import { extractArtworkFromMockupApi } from "@/lib/api";

interface ArtworkExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  states: USState[];
  selectedStateCode: string;
  onArtworkExtracted: (artwork: Artwork, autoNavigateToMockup?: boolean) => void;
}

export const ArtworkExtractorModal: React.FC<ArtworkExtractorModalProps> = ({
  isOpen,
  onClose,
  states,
  selectedStateCode,
  onArtworkExtracted
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [hint, setHint] = useState<string>("");
  const [targetState, setTargetState] = useState<string>(selectedStateCode || "TX");
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractedArtwork, setExtractedArtwork] = useState<Artwork | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setExtractedArtwork(null);
      setErrorMsg(null);
      const reader = new FileReader();
      reader.onload = () => setPreviewSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setExtractedArtwork(null);
      setErrorMsg(null);
      const reader = new FileReader();
      reader.onload = () => setPreviewSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleStartExtraction = async () => {
    if (!selectedFile) return;
    setIsExtracting(true);
    setErrorMsg(null);
    setActiveStep(1);

    // Visual step progression
    const stepTimer1 = setTimeout(() => setActiveStep(2), 2500);
    const stepTimer2 = setTimeout(() => setActiveStep(3), 6000);
    const stepTimer3 = setTimeout(() => setActiveStep(4), 12000);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (title.trim()) formData.append("title", title.trim());
      if (hint.trim()) formData.append("hint", hint.trim());
      formData.append("target_state", targetState);
      formData.append("extraction_engine", "shopapi");

      const res = await extractArtworkFromMockupApi(formData);
      if (res.success && res.artwork) {
        setExtractedArtwork(res.artwork);
        setActiveStep(5);
        onArtworkExtracted(res.artwork, false);
      } else {
        throw new Error(res.message || "Không thể trích xuất thiết kế từ ảnh");
      }
    } catch (err: any) {
      console.error("Extraction error:", err);
      setErrorMsg(err.message || "Lỗi trong quá trình trích xuất hình ảnh qua AI");
      setActiveStep(0);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsExtracting(false);
    }
  };

  const handleSendToMockupStudio = () => {
    if (extractedArtwork) {
      onArtworkExtracted(extractedArtwork, true);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide text-white flex items-center gap-2">
                AI POD ARTWORK EXTRACTOR & 4K RESTORATION
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                  ShopAPI 4K
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tự động tách logo/graphic trên áo mockup thành file thiết kế 4K phẳng trong suốt (Alpha = 0, 4500x5400 px, 300 DPI)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!extractedArtwork ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Upload area */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>1. Tải Lên Ảnh Áo Có Logo Cần Tách</span>
                  <span className="text-[10px] text-amber-400 font-mono">PNG / JPG / WEBP</span>
                </label>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[280px] ${
                    previewSrc
                      ? "border-amber-500/60 bg-slate-900/40"
                      : "border-slate-700 hover:border-amber-500/60 bg-slate-900/20 hover:bg-slate-900/40"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />

                  {previewSrc ? (
                    <div className="space-y-3">
                      <div className="relative max-h-56 overflow-hidden rounded-xl border border-slate-700 mx-auto">
                        <img
                          src={previewSrc}
                          alt="Uploaded mockup"
                          className="max-h-56 object-contain rounded-lg"
                        />
                      </div>
                      <p className="text-xs text-amber-300 font-medium">
                        Click để chọn ảnh khác ({selectedFile?.name})
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200">
                          Kéo thả ảnh áo hoặc nhấn để chọn
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Hỗ trợ ảnh người mẫu mặc áo hoặc áo chụp flat-lay trải sàn
                        </p>
                      </div>
                      <span className="inline-block px-3 py-1 bg-slate-800 text-[11px] font-medium text-slate-300 rounded-lg">
                        Duyệt file từ máy tính
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Settings & Instructions */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    2. Cấu Hình & Gợi Ý Trích Xuất
                  </label>

                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Tên Thiết Kế Sau Tách:
                    </span>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ví dụ: USAF Tactical Eagle Emblem"
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Gợi Ý Cho AI Tập Trung (Hint - Tùy chọn):
                    </span>
                    <input
                      type="text"
                      value={hint}
                      onChange={(e) => setHint(e.target.value)}
                      placeholder="Ví dụ: Logo tròn giữa ngực, bỏ túi áo nhỏ, giữ chữ Texas"
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Gắn Liền Với Bang (Target State):
                    </span>
                    <select
                      value={targetState}
                      onChange={(e) => setTargetState(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      {states.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code} - {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4 Steps Info Banner */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-[11px] text-slate-400">
                    <p className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Quy trình AI Tách Logo Chuyên Nghiệp:
                    </p>
                    <ul className="space-y-1 pl-4 list-disc text-slate-300">
                      <li>Tự động crop quanh logo & khử toàn bộ nếp nhăn, người mẫu</li>
                      <li>Nắn phẳng 2D chính diện, bù trừ độ cong của ngực áo</li>
                      <li>Khử màu vải nền (knockout) thành 100% trong suốt (Alpha = 0)</li>
                      <li>Xuất chuẩn 4K Master POD: 4500 x 5400 px @ 300 DPI</li>
                    </ul>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  disabled={!selectedFile || isExtracting}
                  onClick={handleStartExtraction}
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl ${
                    !selectedFile || isExtracting
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                      : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20 active:scale-[0.99]"
                  }`}
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>AI Đang Tách Logo & Nắn Phẳng 4K...</span>
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4" />
                      <span>BẮT ĐẦU TRÍCH XUẤT THIẾT KẾ 4K TRONG SUỐT</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Result Screen: Extracted Artwork */
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-emerald-300">
                      Trích Xuất Logo Thành Công — Master 4K DTG Đã Sẵn Sàng!
                    </h3>
                    <p className="text-xs text-slate-400">
                      Đã lưu vào bộ sưu tập Artwork của bạn. File trong suốt hoàn toàn (Alpha = 0), không còn màu vải nền hay nếp gấp.
                    </p>
                  </div>
                </div>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original Mockup */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shirt className="w-3.5 h-3.5" />
                    Ảnh Áo Gốc Ban Đầu
                  </span>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center min-h-[300px]">
                    <img
                      src={previewSrc || ""}
                      alt="Original Mockup"
                      className="max-h-72 object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Extracted 4K Artwork */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Thiết Kế 4K Trong Suốt (Alpha = 0)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      4500 x 5400 px &bull; 300 DPI
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 checkerboard-bg border border-slate-700 flex items-center justify-center min-h-[300px] shadow-inner">
                    <img
                      src={extractedArtwork.preview_url}
                      alt="Extracted Artwork"
                      className="max-h-72 object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <a
                  href={extractedArtwork.metadata?.transparent_url || extractedArtwork.preview_url}
                  download={`${extractedArtwork.id}_4K_master.png`}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Tải File 4K Master (.PNG)</span>
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
          )}

          {/* Stepper Status during extraction */}
          {isExtracting && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span>Tiến Trình Xử Lý AI Chuyên Sâu</span>
                <span className="text-amber-400 font-mono">Đang thực hiện...</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-[10px]">
                <div className={`p-2 rounded-lg border text-center transition-all ${activeStep >= 1 ? "border-amber-500 bg-amber-500/15 text-amber-300 font-bold" : "border-slate-800 bg-slate-950 text-slate-500"}`}>
                  1. Quét Graphic
                </div>
                <div className={`p-2 rounded-lg border text-center transition-all ${activeStep >= 2 ? "border-amber-500 bg-amber-500/15 text-amber-300 font-bold" : "border-slate-800 bg-slate-950 text-slate-500"}`}>
                  2. Nắn Phẳng 2D
                </div>
                <div className={`p-2 rounded-lg border text-center transition-all ${activeStep >= 3 ? "border-amber-500 bg-amber-500/15 text-amber-300 font-bold" : "border-slate-800 bg-slate-950 text-slate-500"}`}>
                  3. Tách Nền Alpha
                </div>
                <div className={`p-2 rounded-lg border text-center transition-all ${activeStep >= 4 ? "border-amber-500 bg-amber-500/15 text-amber-300 font-bold" : "border-slate-800 bg-slate-950 text-slate-500"}`}>
                  4. Xuất 4K 300DPI
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

