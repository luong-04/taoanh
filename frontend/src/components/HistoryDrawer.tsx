"use client";

import React, { useState } from "react";
import { 
  Archive, 
  Download, 
  Trash2, 
  X, 
  Shirt, 
  Sparkles, 
  ExternalLink, 
  PackageCheck,
  Loader2,
  FileText
} from "lucide-react";
import { Artwork, Mockup } from "@/lib/types";
import { deleteHistoryItem, exportBundleZip } from "@/lib/api";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  artworks: Artwork[];
  mockups: Mockup[];
  onRefresh: () => void;
  onSelectArtwork: (artwork: Artwork) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  artworks,
  mockups,
  onRefresh,
  onSelectArtwork
}) => {
  const [activeTab, setActiveTab] = useState<"artworks" | "mockups">("artworks");
  const [exportingId, setExportingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async (artworkId: string) => {
    setExportingId(artworkId);
    try {
      const downloadUrl = await exportBundleZip(artworkId);
      // Trigger browser download
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

  const handleDelete = async (type: "artwork" | "mockup", id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await deleteHistoryItem(type, id);
      onRefresh();
    } catch (e: any) {
      alert("Delete failed: " + (e.message || "Unknown error"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Studio Generation History & Export</h2>
              <p className="text-xs text-slate-400">Manage assets and download complete POD seller bundles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("artworks")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "artworks"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Artworks ({artworks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("mockups")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "mockups"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>Mockups ({mockups.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ZIP includes: 4500x5400 PNG + Mockups + Etsy 13 Tags + Amazon Copy</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {activeTab === "artworks" ? (
            artworks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {artworks.map((art) => (
                  <div
                    key={art.id}
                    className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-3 transition-all"
                  >
                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-lg bg-slate-950 checkerboard-bg border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={art.preview_url}
                          alt={art.title}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div className="overflow-hidden flex-1 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-200 truncate">{art.title}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {art.state_code}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-400/90 font-medium truncate">"{art.slogan}"</p>
                        <p className="text-[10px] text-slate-400">
                          {art.theme} &bull; {art.design_style} &bull; {art.product_color}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono">
                          {new Date(art.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            onSelectArtwork(art);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors"
                        >
                          Load in Studio
                        </button>
                        <button
                          onClick={() => handleDelete("artwork", art.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete artwork"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleExport(art.id)}
                        disabled={exportingId === art.id}
                        className="px-2.5 py-1 rounded text-[11px] font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        {exportingId === art.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        <span>Export ZIP Bundle</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs space-y-1">
                <Sparkles className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-slate-400">No Artworks in History</p>
                <p>Generated transparent decals will appear here.</p>
              </div>
            )
          ) : mockups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {mockups.map((mock) => (
                <div
                  key={mock.id}
                  className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-3 transition-all"
                >
                  <div className="flex gap-3">
                    <div className="w-20 h-24 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={mock.preview_url}
                        alt={mock.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="overflow-hidden flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-200 truncate">{mock.title}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-800 text-amber-400">
                          {mock.aspect_ratio}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">{mock.garment_color} Garment</p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {mock.environment.replace("_", " ")} &bull; {mock.model_gender} ({mock.model_age})
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono">
                        {new Date(mock.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <button
                      onClick={() => handleDelete("mockup", mock.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete mockup"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={`/static/mockups/${mock.id}.png`}
                      download={`MOCKUP_${mock.id}.png`}
                      className="px-2.5 py-1 rounded text-[11px] font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download Mockup</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs space-y-1">
              <Shirt className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-slate-400">No Mockups in History</p>
              <p>Composited lifestyle mockups will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

