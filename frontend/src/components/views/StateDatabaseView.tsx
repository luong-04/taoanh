"use client";

import React, { useState } from "react";
import { 
  Database, 
  Search, 
  MapPin, 
  Shield, 
  Sparkles, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  Award,
  Users
} from "lucide-react";
import { USState } from "@/lib/types";
import { syncGoogleSheetsApi } from "@/lib/api";

interface StateDatabaseViewProps {
  states: USState[];
  selectedStateCode: string;
  onSelectState: (code: string) => void;
  onNavigateToArtwork: (code: string) => void;
  onRefreshStates: () => void;
}

export const StateDatabaseView: React.FC<StateDatabaseViewProps> = ({
  states,
  selectedStateCode,
  onSelectState,
  onNavigateToArtwork,
  onRefreshStates
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState<USState | undefined>(
    states.find((s) => s.code === selectedStateCode) || states[0]
  );
  
  // Google Sheets Sync state
  const [sheetUrl, setSheetUrl] = useState("https://docs.google.com/spreadsheets/d/1hQdJR-oo8A0olVHx7pVMl8eAt6LEJPdB/edit?usp=drivesdk");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const filteredStates = states.filter((s) => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSyncSheet = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await syncGoogleSheetsApi(sheetUrl);
      setSyncStatus({ success: true, message: res.message });
      onRefreshStates();
    } catch (e: any) {
      setSyncStatus({ success: false, message: e.message || "Failed to sync" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStateClick = (s: USState) => {
    setSelectedState(s);
    onSelectState(s.code);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sync Panel */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-400" />
              <span>US State Intelligence Database</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              50 US States Census ACS 2024 & Pew Research demographics, military installations, and cultural symbols
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              ✓ 50 States Loaded
            </span>
          </div>
        </div>

        {/* Google Sheets Sync Box */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-300 flex items-center gap-1.5">
              <span>Google Sheets Data Synchronization</span>
              <a
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-0.5 font-normal"
              >
                Open Sheet <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>
            {syncStatus && (
              <span className={`text-[11px] font-medium flex items-center gap-1 ${syncStatus.success ? "text-emerald-400" : "text-rose-400"}`}>
                {syncStatus.success ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {syncStatus.message}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            />
            <button
              onClick={handleSyncSheet}
              disabled={isSyncing}
              className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Google Sheets"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split: Left State List (4 cols) & Right State Detail Dossier (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left State List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search 50 states (e.g. Texas, OH, South)..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1.5 max-h-[700px] overflow-y-auto pr-1">
            {filteredStates.map((s) => {
              const isSelected = selectedState?.code === s.code;
              return (
                <div
                  key={s.code}
                  onClick={() => handleStateClick(s)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500 text-slate-100 shadow-md shadow-amber-500/10"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                      {s.code}
                    </span>
                    <div className="leading-tight">
                      <span className="font-bold text-xs block text-slate-100">{s.name}</span>
                      <span className="text-[10px] text-slate-400 truncate block">"{s.nickname}"</span>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <div className="hidden sm:block">
                      <span className="text-[10px] font-bold text-amber-400 block">
                        {s.demographics.veteran_percentage}% Vets
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {(s.demographics.population / 1_000_000).toFixed(1)}M pop
                      </span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? "text-amber-400" : "text-slate-600"}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right State Detail Dossier */}
        <div className="lg:col-span-8">
          {selectedState ? (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
              {/* Header Dossier */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <span className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-lg flex items-center justify-center shrink-0">
                    {selectedState.code}
                  </span>
                  <div>
                    <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                      <span>{selectedState.name}</span>
                      <span className="text-xs font-normal text-amber-400 italic">"{selectedState.nickname}"</span>
                    </h2>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>Capital: {selectedState.capital}</span>
                      <span>&bull;</span>
                      <span>Region: {selectedState.region}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToArtwork(selectedState.code)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-md shadow-amber-500/20 flex items-center gap-2 shrink-0 transition-all"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Design for {selectedState.name} &rarr;</span>
                </button>
              </div>

              {/* Cultural Vibe Banner */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Cultural Identity & Regional Vibe
                </span>
                <p className="text-xs font-medium text-slate-200 leading-relaxed">
                  {selectedState.cultural_heritage.regional_vibe}
                </p>
              </div>

              {/* Demographics Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Total Population (ACS)</span>
                  <span className="text-base font-bold text-slate-100 block mt-0.5">
                    {selectedState.demographics.population.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Median Age</span>
                  <span className="text-base font-bold text-slate-100 block mt-0.5">
                    {selectedState.demographics.median_age} yrs
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Veteran Population</span>
                  <span className="text-base font-bold text-amber-400 block mt-0.5">
                    {selectedState.demographics.veteran_population.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Veteran Density</span>
                  <span className="text-base font-bold text-emerald-400 block mt-0.5">
                    {selectedState.demographics.veteran_percentage}%
                  </span>
                </div>
              </div>

              {/* Race & Ethnicity Distribution Bars */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Race & Ethnicity Distribution (Census ACS 2024)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  {Object.entries(selectedState.demographics.race_ethnicity).map(([race, pct]) => (
                    <div key={race} className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400 capitalize">{race.replace("_", " ")}</span>
                        <span className="font-bold text-slate-200">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Religion & Values (Pew Research) */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Religion & Values Affiliation (Pew Research 2023–2024)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Christian:</span>
                    <span className="font-bold text-slate-200">{selectedState.religion_values.christian_pct}%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Evangelical:</span>
                    <span className="font-bold text-slate-200">{selectedState.religion_values.evangelical_pct}%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Catholic:</span>
                    <span className="font-bold text-slate-200">{selectedState.religion_values.catholic_pct}%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Unaffiliated:</span>
                    <span className="font-bold text-slate-200">{selectedState.religion_values.unaffiliated_pct}%</span>
                  </div>
                </div>
              </div>

              {/* Military Ties & Key Bases */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Key Military Installations & Defense Centers</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedState.cultural_heritage.military_ties.map((base, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700"
                    >
                      {base}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cultural Emblems Badges */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Heritage Emblems, Bird & State Flower</span>
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {selectedState.cultural_heritage.symbols.map((sym, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    >
                      {sym}
                    </span>
                  ))}
                  <span className="px-2.5 py-1 rounded-lg font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    State Bird: {selectedState.cultural_heritage.state_bird}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    State Flower: {selectedState.cultural_heritage.state_flower}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
              Select a state from the list to view its complete intelligence dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

