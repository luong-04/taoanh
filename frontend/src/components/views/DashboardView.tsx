"use client";

import React from "react";
import { 
  Sparkles, 
  Shirt, 
  Database, 
  ArrowRight, 
  Shield, 
  Users, 
  Award, 
  Flame, 
  Layers, 
  Download,
  FolderSync
} from "lucide-react";
import { USState, Artwork, Mockup } from "@/lib/types";
import { StudioTab } from "@/components/Sidebar";

interface DashboardViewProps {
  onNavigate: (tab: StudioTab) => void;
  selectedState: USState | undefined;
  artworks: Artwork[];
  mockups: Mockup[];
  onSelectArtwork: (artwork: Artwork) => void;
  onOpenSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  selectedState,
  artworks,
  mockups,
  onSelectArtwork,
  onOpenSettings
}) => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0d1627] to-slate-900 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              US Market · State-Aware POD Studio
            </span>
            <span className="text-xs text-slate-400">ACS 2024 & Pew Research Data Active</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            Design Studio for Military & Veteran Apparel
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Harness real demographic, religious, and cultural metrics across 50 US States to craft authentic, high-converting DTG t-shirt designs and zero-hallucination photorealistic lifestyle mockups.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => onNavigate("artwork")}
            className="px-5 py-3 rounded-xl font-bold text-xs text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Create Design (Module 1)</span>
          </button>
          <button
            onClick={() => onNavigate("mockup")}
            className="px-5 py-3 rounded-xl font-bold text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Shirt className="w-4 h-4 text-amber-400" />
            <span>Mockup Studio (Module 2)</span>
          </button>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium block">US States Database</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-100">50</span>
            <span className="text-xs text-emerald-400 font-semibold">100% Synced</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Census ACS & Pew Research</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium block">Artworks in Studio</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400">{artworks.length}</span>
            <span className="text-xs text-slate-400">DTG Master</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">4500 &times; 5400 px @ 300 DPI</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium block">Commercial Mockups</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400">{mockups.length}</span>
            <span className="text-xs text-slate-400">Zero Hallucination</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Lifestyle & Flat-Lay</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium block">Active Selected State</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-100">{selectedState?.name || "Texas"}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {selectedState?.code || "TX"}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">{selectedState?.nickname}</p>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigate("artwork")}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 cursor-pointer group transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-400 transition-colors">
              1. Create Design (Module 1)
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Synthesize state identity, emblems, and niche slogans. Produce 4500x5400 px, 300 DPI transparent DTG decals.
            </p>
          </div>
          <div className="text-xs font-semibold text-amber-400 flex items-center gap-1">
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate("mockup")}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 cursor-pointer group transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Shirt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors">
              2. Realistic Mockup (Module 2)
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Composite artwork onto realistic models in state-specific environments with fabric displacement and natural shading.
            </p>
          </div>
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <span>Open Mockup Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate("state_database")}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 cursor-pointer group transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 group-hover:text-blue-400 transition-colors">
              3. State Database & Google Sheets
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Inspect Census ACS 2024 population, race, religion, and military installations across 50 states, or sync directly from Google Sheets.
            </p>
          </div>
          <div className="text-xs font-semibold text-blue-400 flex items-center gap-1">
            <span>Explore 50 States</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Recent Artworks & Mockups Row */}
      {artworks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Recent Studio Creations</span>
            </h2>
            <button
              onClick={() => onNavigate("my_designs")}
              className="text-xs text-amber-400 hover:underline"
            >
              View All ({artworks.length})
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {artworks.slice(0, 6).map((art) => (
              <div
                key={art.id}
                onClick={() => {
                  onSelectArtwork(art);
                  onNavigate("artwork");
                }}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer group transition-all space-y-2"
              >
                <div className="w-full h-28 rounded-lg checkerboard-bg flex items-center justify-center p-1 overflow-hidden">
                  <img
                    src={art.preview_url}
                    alt={art.title}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[11px] font-bold text-slate-200 block truncate">{art.title}</span>
                  <span className="text-[10px] text-amber-400 font-medium block truncate">"{art.slogan}"</span>
                  <span className="text-[9px] text-slate-500">{art.state_code} &bull; {art.theme}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

