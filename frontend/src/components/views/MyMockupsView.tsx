"use client";

import React, { useState } from "react";
import { 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Search, 
  ShieldCheck,
  Maximize2,
  Camera
} from "lucide-react";
import { Mockup } from "@/lib/types";
import { deleteHistoryItem } from "@/lib/api";

interface MyMockupsViewProps {
  mockups: Mockup[];
  onRefresh: () => void;
}

export const MyMockupsView: React.FC<MyMockupsViewProps> = ({
  mockups,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = mockups.filter(
    (m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.target_state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.garment_color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.environment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mockup?")) return;
    try {
      await deleteHistoryItem("mockup", id);
      onRefresh();
    } catch (e: any) {
      alert("Delete failed: " + (e.message || "Unknown error"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-400" />
            <span>My Commercial Mockups Gallery</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Photorealistic lifestyle & flat-lay commercial product photography
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search mockups..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 w-48 sm:w-60"
            />
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold shrink-0">
            {filtered.length} Mockups
          </span>
        </div>
      </div>

      {/* Grid of Mockups */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((mock) => (
            <div
              key={mock.id}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-3.5 transition-all shadow-lg"
            >
              <div className="w-full h-64 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative group">
                <img
                  src={mock.preview_url}
                  alt={mock.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute top-2 right-2 bg-slate-950/90 border border-slate-800 text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded backdrop-blur">
                  {mock.aspect_ratio}
                </div>
                <div className="absolute bottom-2 left-2 bg-slate-950/90 border border-slate-800 text-[10px] text-slate-300 px-2 py-0.5 rounded backdrop-blur capitalize">
                  {mock.environment.replace("_", " ")}
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <h3 className="font-extrabold text-slate-100 truncate">{mock.title}</h3>
                <p className="text-[11px] text-slate-300 font-medium">Garment: {mock.garment_color}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 capitalize">
                  <span>{mock.model_gender}</span>
                  <span>&bull;</span>
                  <span>{mock.model_age}</span>
                  <span>&bull;</span>
                  <span>{mock.metadata?.camera_style || "Lifestyle"}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono pt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Artwork 100% Preserved</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleDelete(mock.id)}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Delete mockup"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <a
                  href={`/static/mockups/${mock.id}.png`}
                  download={`MOCKUP_${mock.id}_${mock.garment_color}.png`}
                  className="py-1.5 px-3 rounded-xl font-bold text-xs text-slate-950 bg-amber-500 hover:bg-amber-400 flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Photo</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 text-xs space-y-2 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
          <Camera className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="font-bold text-slate-400">No Mockups Found</p>
          <p>Render commercial mockups in Module 2 to view them here.</p>
        </div>
      )}
    </div>
  );
};

