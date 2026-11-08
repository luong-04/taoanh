"use client";

import React, { useState } from "react";
import { 
  FolderKanban, 
  Download, 
  Trash2, 
  Shirt, 
  Sparkles, 
  Archive, 
  Search, 
  ShieldCheck,
  Loader2,
  Gauge
} from "lucide-react";
import { Artwork } from "@/lib/types";
import { exportBundleZip, deleteHistoryItem } from "@/lib/api";

interface MyDesignsViewProps {
  artworks: Artwork[];
  onSelectArtworkForMockup: (artwork: Artwork) => void;
  onRefresh: () => void;
  onInspectDpi?: (artwork: Artwork) => void;
}

export const MyDesignsView: React.FC<MyDesignsViewProps> = ({
  artworks,
  onSelectArtworkForMockup,
  onRefresh,
  onInspectDpi
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [exportingId, setExportingId] = useState<string | null>(null);

  const filtered = artworks.filter(
    (a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.state_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.slogan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.theme.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = async (artworkId: string) => {
    setExportingId(artworkId);
    try {
      const downloadUrl = await exportBundleZip(artworkId);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `bundle_${artworkId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert("Export failed: " + (e.message || "Unknown error"));
    } finally {
      setExportingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this artwork?")) return;
    try {
      await deleteHistoryItem("artwork", id);
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
            <FolderKanban className="w-5 h-5 text-amber-400" />
            <span>My Designs & Transparent Decals</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            4500x5400 px, 300 DPI transparent PNG direct-to-garment (DTG) print masters
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search designs..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 w-48 sm:w-60"
            />
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold shrink-0">
            {filtered.length} Designs
          </span>
        </div>
      </div>

      {/* Grid of Designs */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((art) => (
            <div
              key={art.id}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-3.5 transition-all shadow-lg"
            >
              {/* Canvas Preview Box */}
              <div className="w-full h-56 rounded-xl checkerboard-bg border border-slate-800/80 flex items-center justify-center p-2 overflow-hidden relative group">
                <img
                  src={art.preview_url}
                  alt={art.title}
                  className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                />
                <div className="absolute top-2 right-2 bg-slate-950/90 border border-slate-800 text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded backdrop-blur">
                  {art.state_code}
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1 text-xs">
                <h3 className="font-extrabold text-slate-100 truncate">{art.title}</h3>
                <p className="text-[11px] text-amber-400 font-semibold truncate">"{art.slogan}"</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span>{art.theme}</span>
                  <span>&bull;</span>
                  <span>{art.design_style}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono pt-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>4500x5400 px @ 300 DPI</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => onSelectArtworkForMockup(art)}
                  className="w-full py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                >
                  <Shirt className="w-3.5 h-3.5" />
                  <span>Create Mockup &rarr;</span>
                </button>

                {onInspectDpi && (
                  <button
                    type="button"
                    onClick={() => onInspectDpi(art)}
                    className="w-full py-1.5 px-2 rounded-lg text-[11px] font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                    <span>Đo &amp; Nâng Cấp 300 DPI</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleExport(art.id)}
                    disabled={exportingId === art.id}
                    className="py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-1 transition-colors"
                  >
                    {exportingId === art.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3 text-amber-400" />}
                    <span>ZIP Bundle</span>
                  </button>

                  <a
                    href={`/static/artworks/${art.id}_dtg_master.png`}
                    download={`POD_${art.state_code}_${art.theme}_4500x5400.png`}
                    className="py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>DTG PNG</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 text-xs space-y-2 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
          <FolderKanban className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="font-bold text-slate-400">No Designs Found</p>
          <p>Generate transparent decals in Module 1 to populate your design library.</p>
        </div>
      )}
    </div>
  );
};

