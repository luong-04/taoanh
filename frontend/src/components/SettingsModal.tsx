"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Shield, 
  FolderCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { BYOKSettings } from "@/lib/types";
import { getStoredSettings, saveStoredSettings } from "@/lib/storage";
import { verifyApiKey } from "@/lib/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<BYOKSettings>(getStoredSettings());
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testStatus, setTestStatus] = useState<Record<string, { loading: boolean; valid?: boolean; message?: string }>>({});
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getStoredSettings());
      setSavedNotice(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleKeyChange = (keyField: keyof BYOKSettings, value: string) => {
    const updated = { ...settings, [keyField]: value };
    setSettings(updated);
  };

  const handleSave = () => {
    saveStoredSettings(settings);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const runTest = async (provider: string, keyField: keyof BYOKSettings) => {
    const key = (settings[keyField] as string) || "";
    if (!key.trim()) {
      setTestStatus(prev => ({ ...prev, [provider]: { loading: false, valid: false, message: "Enter a key first" } }));
      return;
    }

    setTestStatus(prev => ({ ...prev, [provider]: { loading: true } }));
    try {
      const res = await verifyApiKey(provider, key);
      setTestStatus(prev => ({
        ...prev,
        [provider]: { loading: false, valid: res.valid, message: res.message }
      }));
    } catch (e: any) {
      setTestStatus(prev => ({
        ...prev,
        [provider]: { loading: false, valid: false, message: e.message || "Failed to connect" }
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Settings & BYOK Providers</h2>
              <p className="text-xs text-slate-400">Bring Your Own Key for high-speed direct external generation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Security Notice */}
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
            <Shield className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-200">100% Local & Secure BYOK</p>
              <p className="text-slate-300 mt-0.5">
                Your keys remain strictly in browser storage or encrypted local memory. If you leave all keys empty, the studio automatically runs the high-fidelity local procedural engine without requiring external APIs.
              </p>
            </div>
          </div>

          {/* Image Gen Providers */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Image Generation Providers</span>
            </h3>

            {/* Fal.ai */}
            <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <span>Fal.ai (Flux.1 Schnell / Dev)</span>
                  <a
                    href="https://fal.ai/dashboard/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    Get Key <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                {testStatus["fal"] && (
                  <span className={`text-[11px] flex items-center gap-1 ${testStatus["fal"].valid ? "text-emerald-400" : "text-rose-400"}`}>
                    {testStatus["fal"].valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {testStatus["fal"].message}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKeys["fal"] ? "text" : "password"}
                    value={settings.falKey}
                    onChange={(e) => handleKeyChange("falKey", e.target.value)}
                    placeholder="fal-..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:border-amber-500 pr-8 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey("fal")}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
                  >
                    {showKeys["fal"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  onClick={() => runTest("fal", "falKey")}
                  disabled={testStatus["fal"]?.loading}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 shrink-0 flex items-center gap-1.5"
                >
                  {testStatus["fal"]?.loading && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
                  Test
                </button>
              </div>
            </div>

            {/* Replicate */}
            <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <span>Replicate (Flux / SDXL)</span>
                  <a
                    href="https://replicate.com/account/api-tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    Get Token <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                {testStatus["replicate"] && (
                  <span className={`text-[11px] flex items-center gap-1 ${testStatus["replicate"].valid ? "text-emerald-400" : "text-rose-400"}`}>
                    {testStatus["replicate"].valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {testStatus["replicate"].message}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKeys["replicate"] ? "text" : "password"}
                    value={settings.replicateKey}
                    onChange={(e) => handleKeyChange("replicateKey", e.target.value)}
                    placeholder="r8_..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:border-amber-500 pr-8 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey("replicate")}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
                  >
                    {showKeys["replicate"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  onClick={() => runTest("replicate", "replicateKey")}
                  disabled={testStatus["replicate"]?.loading}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 shrink-0 flex items-center gap-1.5"
                >
                  {testStatus["replicate"]?.loading && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
                  Test
                </button>
              </div>
            </div>

            {/* Google Gemini / Imagen 3 */}
            <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <span>Google Gemini / Imagen 3</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    Get Key <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                {testStatus["gemini"] && (
                  <span className={`text-[11px] flex items-center gap-1 ${testStatus["gemini"].valid ? "text-emerald-400" : "text-rose-400"}`}>
                    {testStatus["gemini"].valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {testStatus["gemini"].message}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKeys["gemini"] ? "text" : "password"}
                    value={settings.geminiKey}
                    onChange={(e) => handleKeyChange("geminiKey", e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:border-amber-500 pr-8 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey("gemini")}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
                  >
                    {showKeys["gemini"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  onClick={() => runTest("gemini", "geminiKey")}
                  disabled={testStatus["gemini"]?.loading}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 shrink-0 flex items-center gap-1.5"
                >
                  {testStatus["gemini"]?.loading && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
                  Test
                </button>
              </div>
            </div>

            {/* OpenAI */}
            <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <span>OpenAI (DALL-E 3)</span>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    Get Key <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                {testStatus["openai"] && (
                  <span className={`text-[11px] flex items-center gap-1 ${testStatus["openai"].valid ? "text-emerald-400" : "text-rose-400"}`}>
                    {testStatus["openai"].valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {testStatus["openai"].message}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKeys["openai"] ? "text" : "password"}
                    value={settings.openaiKey}
                    onChange={(e) => handleKeyChange("openaiKey", e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:border-amber-500 pr-8 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey("openai")}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
                  >
                    {showKeys["openai"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  onClick={() => runTest("openai", "openaiKey")}
                  disabled={testStatus["openai"]?.loading}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 shrink-0 flex items-center gap-1.5"
                >
                  {testStatus["openai"]?.loading && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
                  Test
                </button>
              </div>
            </div>
          </div>

          {/* Virtual Try-On API */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Virtual Try-On / Mockup Providers</span>
            </h3>

            {/* FASHN.ai */}
            <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <span>FASHN.ai API</span>
                  <a
                    href="https://fashn.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    Get Key <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                {testStatus["fashn"] && (
                  <span className={`text-[11px] flex items-center gap-1 ${testStatus["fashn"].valid ? "text-emerald-400" : "text-rose-400"}`}>
                    {testStatus["fashn"].valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {testStatus["fashn"].message}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKeys["fashn"] ? "text" : "password"}
                    value={settings.fashnKey}
                    onChange={(e) => handleKeyChange("fashnKey", e.target.value)}
                    placeholder="fa-..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:border-amber-500 pr-8 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey("fashn")}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
                  >
                    {showKeys["fashn"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  onClick={() => runTest("fashn", "fashnKey")}
                  disabled={testStatus["fashn"]?.loading}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 shrink-0 flex items-center gap-1.5"
                >
                  {testStatus["fashn"]?.loading && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
                  Test
                </button>
              </div>
            </div>
          </div>

          {/* Local Storage Target Status */}
          <div className="p-3.5 rounded-lg bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <FolderCheck className="w-4 h-4 text-amber-400" />
              <span>Target Output Directories</span>
            </div>
            <p className="font-mono text-[11px] text-slate-400">
              Artworks: ./output/artworks/ &bull; Mockups: ./output/mockups/
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
          <span className="text-xs text-emerald-400 font-medium">
            {savedNotice ? "✓ Settings saved successfully!" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-md shadow-amber-500/20 transition-all"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

