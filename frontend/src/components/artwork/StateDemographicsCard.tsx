"use client";

import React, { useState } from "react";
import { 
  Shield, 
  MapPin, 
  Users, 
  Heart, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Award,
  Landmark
} from "lucide-react";
import { USState } from "@/lib/types";

interface StateDemographicsCardProps {
  state: USState;
}

export const StateDemographicsCard: React.FC<StateDemographicsCardProps> = ({ state }) => {
  const [expanded, setExpanded] = useState(false);
  const demo = state.demographics;
  const rel = state.religion_values;
  const cult = state.cultural_heritage;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3.5 backdrop-blur-sm">
      {/* State Header Card */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-sm flex items-center justify-center">
              {state.code}
            </span>
            <div>
              <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                {state.name}
              </h3>
              <p className="text-xs text-amber-400/90 italic font-medium">"{state.nickname}"</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-slate-500" />
            Capital: {state.capital} &bull; {state.region}
          </p>
        </div>

        {/* Veteran Density Highlight Pill */}
        <div className="bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg text-right">
          <div className="flex items-center gap-1 justify-end text-[11px] font-bold text-amber-400">
            <Shield className="w-3 h-3 fill-amber-400/30" />
            <span>{demo.veteran_percentage}% Veterans</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {demo.veteran_population.toLocaleString()} heroes
          </span>
        </div>
      </div>

      {/* Regional Vibe Banner */}
      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
          State Cultural Identity & Regional Vibe
        </span>
        <p className="mt-0.5 font-medium text-slate-200 text-[11px] leading-relaxed">
          {cult.regional_vibe}
        </p>
      </div>

      {/* Military Ties Badges */}
      <div>
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1 mb-1.5">
          <Award className="w-3 h-3 text-amber-400" />
          Key Military Installations & Ties
        </span>
        <div className="flex flex-wrap gap-1.5">
          {cult.military_ties.slice(0, 3).map((base, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/80"
            >
              {base}
            </span>
          ))}
          {cult.military_ties.length > 3 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800/60 text-slate-400">
              +{cult.military_ties.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Cultural Emblems Badges */}
      <div>
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1 mb-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Heritage Emblems & Symbols
        </span>
        <div className="flex flex-wrap gap-1.5">
          {cult.symbols.map((symbol, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/5 text-amber-300/90 border border-amber-500/20"
            >
              {symbol}
            </span>
          ))}
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            Bird: {cult.state_bird}
          </span>
        </div>
      </div>

      {/* Expand/Collapse Demographics Details Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-1 text-center text-[11px] font-semibold text-slate-400 hover:text-amber-400 flex items-center justify-center gap-1 transition-colors border-t border-slate-800/80 pt-2"
      >
        <span>{expanded ? "Hide Detailed Metrics" : "View Census & Demographic Data"}</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* Expanded Census Demographic & Faith Metrics */}
      {expanded && (
        <div className="space-y-3 pt-2 text-xs border-t border-slate-800/60 animate-in fade-in duration-150">
          {/* Population & Age */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Population</span>
              <span className="font-bold text-slate-200">{demo.population.toLocaleString()}</span>
            </div>
            <div className="p-2 rounded bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Median Age</span>
              <span className="font-bold text-slate-200">{demo.median_age} years</span>
            </div>
          </div>

          {/* Race & Ethnicity Distribution */}
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
              Race & Ethnicity (Census ACS)
            </span>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">White</span>
                <span className="font-semibold text-slate-200">{demo.race_ethnicity.white}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full" style={{ width: `${demo.race_ethnicity.white}%` }} />
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <span className="text-slate-400">Black / African American</span>
                <span className="font-semibold text-slate-200">{demo.race_ethnicity.black}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${demo.race_ethnicity.black}%` }} />
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <span className="text-slate-400">Hispanic / Latino</span>
                <span className="font-semibold text-slate-200">{demo.race_ethnicity.hispanic}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${demo.race_ethnicity.hispanic}%` }} />
              </div>
            </div>
          </div>

          {/* Faith & Values */}
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
              Religion & Values (Pew Research)
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="p-1.5 rounded bg-slate-950/40 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Christian:</span>
                <span className="font-bold text-slate-200">{rel.christian_pct}%</span>
              </div>
              <div className="p-1.5 rounded bg-slate-950/40 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Evangelical:</span>
                <span className="font-bold text-slate-200">{rel.evangelical_pct}%</span>
              </div>
              <div className="p-1.5 rounded bg-slate-950/40 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Catholic:</span>
                <span className="font-bold text-slate-200">{rel.catholic_pct}%</span>
              </div>
              <div className="p-1.5 rounded bg-slate-950/40 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Unaffiliated:</span>
                <span className="font-bold text-slate-200">{rel.unaffiliated_pct}%</span>
              </div>
            </div>
          </div>

          {/* State Motto */}
          <div className="text-[11px] text-slate-400 italic text-center pt-1">
            Motto: "{state.motto}"
          </div>
        </div>
      )}
    </div>
  );
};

