"use client";

import React, { useState } from "react";
import { 
  Terminal, 
  Sparkles, 
  Edit3, 
  RotateCcw, 
  ShieldAlert, 
  Loader2, 
  CheckCircle,
  Copy,
  Info,
  Wand2,
  Check,
  Award,
  RefreshCw
} from "lucide-react";
import { CreativeConcept, USState } from "@/lib/types";

interface PromptInspectorProps {
  prompt: string;
  setPrompt: (p: string) => void;
  negativePrompt: string;
  setNegativePrompt: (np: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onResetPrompt: () => void;
  state: USState | undefined;
  designStyle: string;
  concepts: CreativeConcept[];
  onSelectConcept: (concept: CreativeConcept) => void;
  selectedConceptId?: string;
  workingMode: "guided" | "manual";
  batchSize: number;
  onRefreshConcepts?: () => void;
  isLoadingConcepts?: boolean;
}

export const PromptInspector: React.FC<PromptInspectorProps> = ({
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  isGenerating,
  onGenerate,
  onResetPrompt,
  state,
  designStyle,
  concepts,
  onSelectConcept,
  selectedConceptId,
  workingMode,
  batchSize,
  onRefreshConcepts,
  isLoadingConcepts
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {workingMode === "guided" ? (
            <Wand2 className="w-4 h-4 text-amber-400" />
          ) : (
            <Terminal className="w-4 h-4 text-amber-400" />
          )}
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {workingMode === "guided" ? "AI Concepts & Dữ Liệu Bang Mỹ" : "Trình Soạn Thảo Prompt Chi Tiết"}
          </h2>
        </div>

        <button
          onClick={handleCopy}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          title="Sao chép prompt tiếng Anh"
        >
          {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* State Intelligence Summary Pill */}
      {state && (
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-200 flex items-center gap-1.5">
              <span>Hồ Sơ Nhân Khẩu Bang {state.name} ({state.code})</span>
            </span>
            <span className="text-[10px] font-bold text-amber-400">
              {state.demographics.veteran_percentage}% Cựu Binh ({state.demographics.veteran_population.toLocaleString()} người)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 italic">"{state.nickname}" &bull; Đặc trưng: {state.cultural_heritage.regional_vibe}</p>
          <div className="flex flex-wrap gap-1 pt-1">
            {state.cultural_heritage.symbols.slice(0, 4).map((sym, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 text-amber-300/90 border border-slate-800">
                {sym}
              </span>
            ))}
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 text-slate-400 border border-slate-800">
              Da trắng: {state.demographics.race_ethnicity.white}% &bull; Da màu: {state.demographics.race_ethnicity.black}% &bull; Hispanic: {state.demographics.race_ethnicity.hispanic}%
            </span>
          </div>
        </div>
      )}

      {/* AI Guided Mode: 3-4 Independent Creative Concepts */}
      {workingMode === "guided" && concepts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>4 Concept Độc Lập Theo Bang (Bấm Để Áp Dụng):</span>
            </span>
            {onRefreshConcepts && (
              <button
                type="button"
                onClick={onRefreshConcepts}
                disabled={isLoadingConcepts}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 hover:border-amber-400 transition-all shadow-sm"
                title="AI tạo 4 concept mới bám sát dữ liệu bang này"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isLoadingConcepts ? "animate-spin text-amber-300" : ""}`} />
                <span>{isLoadingConcepts ? "Đang đổi..." : "Đổi Concept AI"}</span>
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {concepts.map((c) => {
              const isSelected = selectedConceptId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectConcept(c)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500 text-slate-100 shadow-md shadow-amber-500/10"
                      : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      {c.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[11px] font-extrabold text-amber-400">"{c.slogan}"</p>

                  {/* Dòng Tiếng Việt mô tả trực quan kiểu dáng thiết kế */}
                  {c.description_vi && (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-snug flex items-start gap-1.5">
                      <span className="font-bold text-amber-400 shrink-0">Kiểu dáng:</span>
                      <span>{c.description_vi}</span>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 leading-normal">{c.elements}</p>
                  <div className="text-[9px] text-slate-500 flex items-center justify-between pt-0.5">
                    <span>Màu: {c.palette}</span>
                    <span className="italic">{c.vibe}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Prompt Box */}
      <div className="space-y-1.5 flex-1 flex flex-col min-h-[140px]">
        <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
          <span>Prompt Chi Tiết Bằng Tiếng Anh (Gửi Đến AI Tạo Ảnh)</span>
          <span className="text-[10px] text-slate-500 font-mono">{prompt.length} ký tự</span>
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="w-full flex-1 p-3 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 resize-none leading-relaxed selection:bg-amber-500 selection:text-black"
        />
      </div>

      {/* Negative Prompt */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          <span>Prompt Phủ Định Nghiêm Ngặt (Loại bỏ người, áo 3D nhăn, chữ sai chính tả)</span>
        </label>
        <textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          rows={2}
          className="w-full p-2 text-[10px] font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-400 focus:outline-none focus:border-rose-500 resize-none"
        />
      </div>

      {/* Primary Action Button */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99]"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            <span>AI Đang Tạo {batchSize > 1 ? `${batchSize} Biến Thể & Tách Nền Trong Suốt...` : "Thiết Kế & Tách Nền Trong Suốt..."}</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>TẠO {batchSize > 1 ? `${batchSize} THIẾT KẾ` : "THIẾT KẾ"} (CHUẨN IN DTG 4500x5400 px)</span>
          </>
        )}
      </button>
    </div>
  );
};
