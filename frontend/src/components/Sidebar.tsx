"use client";

import React from "react";
import { 
  LayoutDashboard, 
  Sparkles, 
  Shirt, 
  FolderKanban, 
  Image as ImageIcon, 
  Database, 
  Lightbulb, 
  Settings, 
  Flame, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";

export type StudioTab = 
  | "dashboard"
  | "artwork"
  | "mockup"
  | "my_designs"
  | "my_mockups"
  | "state_database"
  | "prompt_library"
  | "settings";

interface SidebarProps {
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  designsCount: number;
  mockupsCount: number;
  selectedStateCode: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  designsCount,
  mockupsCount,
  selectedStateCode
}) => {
  const navItems = [
    { id: "dashboard", label: "Bảng Điều Khiển", icon: LayoutDashboard },
    { id: "artwork", label: "Tạo Thiết Kế", icon: Sparkles, badge: "Module 1" },
    { id: "mockup", label: "Mockup Thực Tế", icon: Shirt, badge: "Module 2" },
    { id: "my_designs", label: "Thiết Kế Của Tôi", icon: FolderKanban, count: designsCount },
    { id: "my_mockups", label: "Mockup Của Tôi", icon: ImageIcon, count: mockupsCount },
    { id: "state_database", label: "Dữ Liệu 50 Bang", icon: Database, badge: "50 Bang" },
    { id: "prompt_library", label: "Thư Viện Prompt", icon: Lightbulb },
    { id: "settings", label: "Cài Đặt & API", icon: Settings },
  ];

  return (
    <aside
      className={`border-r border-slate-800 bg-[#080c15] flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top Branding */}
      <div>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black shrink-0">
                <Flame className="w-5 h-5 fill-slate-950" />
              </div>
              <div className="leading-tight truncate">
                <span className="font-black text-sm tracking-wider text-slate-100 block">
                  POD STUDIO
                </span>
                <span className="text-[10px] text-amber-400 font-medium tracking-tight">
                  US State-Aware Intelligence
                </span>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 mx-auto rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Flame className="w-5 h-5 fill-slate-950" />
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors hidden lg:block"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-2.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as StudioTab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? "scale-110" : "group-hover:scale-105"}`} />
                {!isCollapsed && (
                  <span className="truncate text-left flex-1">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                    isActive ? "bg-slate-950 text-amber-400" : "bg-slate-800 text-amber-400 border border-slate-700"
                  }`}>
                    {item.badge}
                  </span>
                )}
                {!isCollapsed && item.count !== undefined && item.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? "bg-slate-950 text-slate-200" : "bg-slate-800 text-slate-400"
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Market Context & Engine Info */}
      {!isCollapsed && (
        <div className="p-3 m-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Active Market:</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {selectedStateCode}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            <span>Zero-Hallucination DTG</span>
          </div>
        </div>
      )}
    </aside>
  );
};

