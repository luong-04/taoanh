"use client";

import React from "react";
import { 
  Sparkles, 
  Layers, 
  Settings, 
  History, 
  ShieldCheck, 
  CheckCircle2, 
  Flame,
  Shirt
} from "lucide-react";

interface HeaderProps {
  activeTab: "artwork" | "mockup" | "history";
  setActiveTab: (tab: "artwork" | "mockup" | "history") => void;
  onOpenSettings: () => void;
  selectedStateName: string;
  selectedStateCode: string;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  selectedStateName,
  selectedStateCode,
  historyCount
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#0c1220]/90 backdrop-blur sticky top-0 z-40 px-4 lg:px-6 py-3 flex items-center justify-between">
      {/* Brand & State Context */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
          <Flame className="w-6 h-6 fill-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-wider text-slate-100 flex items-center gap-1.5">
              POD DESIGN STUDIO
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              STATE-AWARE
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ShopAPI AI: Sẵn sàng (~1,596 ảnh)
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            Thị trường Mỹ · Bang mục tiêu:{" "}
            <span className="text-amber-400 font-semibold">{selectedStateName} ({selectedStateCode})</span>
          </p>
        </div>
      </div>

      {/* Main Studio Navigation Tabs */}
      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab("artwork")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "artwork"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>1. Tạo Thiết Kế (Artwork)</span>
        </button>

        <button
          onClick={() => setActiveTab("mockup")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "mockup"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Shirt className="w-3.5 h-3.5" />
          <span>2. Tạo Mockup Thực Tế</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "history"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Lịch Sử & Xuất File</span>
          {historyCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-200 border border-slate-700">
              {historyCount}
            </span>
          )}
        </button>
      </div>

      {/* Header Utilities */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-colors"
          title="Cấu hình tài khoản và kết nối AI"
        >
          <Settings className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Cài Đặt & API Key</span>
        </button>
      </div>
    </header>
  );
};

